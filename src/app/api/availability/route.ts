import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const demoId = searchParams.get("demoId");
  const offset = searchParams.get("offset"); // timezone offset in minutes

  if (!demoId) {
    return NextResponse.json({ error: "Missing demoId" }, { status: 400 });
  }

  try {
    const demo = await prisma.demo.findUnique({
      where: { id: demoId },
      include: {
        hours: true,
        blockedDates: true,
        staff: {
          where: { isActive: true },
          include: {
            hours: true,
            services: { include: { service: true } },
          },
        },
        services: true,
      },
    });

    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    const now = new Date();
    // Adjust for client timezone
    const offsetMinutes = offset ? parseInt(offset) : 300; // default to EST (300 mins = 5 hours)
    const localNow = new Date(now.getTime() - offsetMinutes * 60 * 1000);
    const dayOfWeek = localNow.getDay();

    // Check if today is a blocked date
    const isBlockedToday = demo.blockedDates.some(
      (b) => new Date(b.date).toDateString() === localNow.toDateString()
    );

    if (isBlockedToday) {
      return NextResponse.json({
        isOpen: false,
        availableNow: 0,
        totalStaff: demo.staff.length,
        message: "Closed today",
      });
    }

    // Check shop hours for today
    const shopHours = demo.hours.find((h) => h.day === dayOfWeek);
    if (!shopHours || !shopHours.isOpen) {
      return NextResponse.json({
        isOpen: false,
        availableNow: 0,
        totalStaff: demo.staff.length,
        message: "Closed today",
      });
    }

    // Check if within operating hours
    const [openHour, openMin] = shopHours.openTime.split(":").map(Number);
    const [closeHour, closeMin] = shopHours.closeTime.split(":").map(Number);
    const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return NextResponse.json({
        isOpen: false,
        availableNow: 0,
        totalStaff: demo.staff.length,
        message: currentMinutes < openMinutes ? `Opens at ${shopHours.openTime}` : "Closed for today",
      });
    }

    // Shop is open - check staff availability
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);
    const endOfHour = new Date(now);
    endOfHour.setMinutes(59, 59, 999);

    // Get current bookings (within next 30 mins window)
    const windowStart = new Date(now);
    const windowEnd = new Date(now);
    windowEnd.setMinutes(windowEnd.getMinutes() + 30);

    const currentBookings = await prisma.booking.findMany({
      where: {
        demoId,
        status: "confirmed",
        appointmentTime: {
          gte: windowStart,
          lt: windowEnd,
        },
      },
      include: { service: true },
    });

    // Calculate which staff are busy right now
    const busyStaffIds = new Set<string>();
    
    // Get all confirmed bookings that could be in progress right now
    const inProgressBookings = await prisma.booking.findMany({
      where: {
        demoId,
        status: "confirmed",
        staffId: { not: null },
      },
      include: { service: true },
    });

    const WALKIN_BUFFER_MINUTES = 15; // Don't show as available if appointment starts within 15 mins
    
    inProgressBookings.forEach((booking) => {
      if (booking.staffId) {
        const bookingStart = new Date(booking.appointmentTime);
        const bookingEnd = new Date(booking.appointmentTime);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.service.durationMinutes);
        
        // Check if booking starts within the buffer window
        const bufferStart = new Date(now);
        const bookingStartsWithinBuffer = bookingStart > now && bookingStart <= new Date(now.getTime() + WALKIN_BUFFER_MINUTES * 60 * 1000);
        
        // If booking is currently in progress OR starts within buffer
        if ((bookingStart <= now && bookingEnd > now) || bookingStartsWithinBuffer) {
          busyStaffIds.add(booking.staffId);
        }
      }
    });

    // Check which staff are working today
    const workingStaff = demo.staff.filter((s) => {
      // If staff has custom hours, use those; otherwise fall back to shop hours
      const staffDayHours = s.hours.length > 0 
        ? s.hours.find((h) => h.day === dayOfWeek)
        : shopHours;
      
      if (!staffDayHours || !staffDayHours.isOpen) return false;
      
      const [sOpenHour, sOpenMin] = staffDayHours.openTime.split(":").map(Number);
      const [sCloseHour, sCloseMin] = staffDayHours.closeTime.split(":").map(Number);
      const sOpenMinutes = sOpenHour * 60 + sOpenMin;
      const sCloseMinutes = sCloseHour * 60 + sCloseMin;
      
      return currentMinutes >= sOpenMinutes && currentMinutes < sCloseMinutes;
    });

    const availableStaff = workingStaff.filter((s) => !busyStaffIds.has(s.id));

    return NextResponse.json({
      isOpen: true,
      availableNow: availableStaff.length,
      totalStaff: workingStaff.length,
      availableStaffNames: availableStaff.map((s) => s.name),
      message: availableStaff.length > 0 
        ? `${availableStaff.length} barber${availableStaff.length > 1 ? 's' : ''} available now`
        : "All barbers busy",
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}