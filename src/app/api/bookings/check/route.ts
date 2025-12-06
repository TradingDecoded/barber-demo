import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get("demoId");
    const dateStr = searchParams.get("date");
    const offsetStr = searchParams.get("offset");
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");

    if (!demoId || !dateStr) {
      return NextResponse.json(
        { error: "demoId and date are required" },
        { status: 400 }
      );
    }

    const offset = offsetStr ? parseInt(offsetStr) : 0;
    const date = new Date(dateStr);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // If specific staff selected, use simple logic
    if (staffId) {
      const bookings = await prisma.booking.findMany({
        where: {
          demoId,
          staffId,
          appointmentTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "confirmed",
        },
        select: {
          appointmentTime: true,
          service: { select: { durationMinutes: true } },
        },
      });

      const bookedTimes = getBookedTimesFromBookings(bookings, offset);
      return NextResponse.json({ bookedTimes });
    }

    // "Any Available" mode - only block times when ALL qualified staff are booked
    // Get all active staff who can perform this service
    let qualifiedStaff = await prisma.staff.findMany({
      where: {
        demoId,
        isActive: true,
        ...(serviceId ? {
          services: { some: { serviceId } }
        } : {}),
      },
      select: { id: true },
    });

    // If no staff have the service assigned, fall back to all active staff
    if (qualifiedStaff.length === 0) {
      qualifiedStaff = await prisma.staff.findMany({
        where: { demoId, isActive: true },
        select: { id: true },
      });
    }

    const staffIds = qualifiedStaff.map(s => s.id);
    
    if (staffIds.length === 0) {
      return NextResponse.json({ bookedTimes: [] });
    }

    // Get all bookings for all qualified staff
    const allBookings = await prisma.booking.findMany({
      where: {
        demoId,
        staffId: { in: staffIds },
        appointmentTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "confirmed",
      },
      select: {
        staffId: true,
        appointmentTime: true,
        service: { select: { durationMinutes: true } },
      },
    });

    // Build a map of time slots to which staff are booked
    const timeSlotBookings: Map<string, Set<string>> = new Map();

    allBookings.forEach((b) => {
      if (!b.staffId) return;
      const d = new Date(b.appointmentTime);
      const duration = b.service.durationMinutes;
      const slotsNeeded = Math.ceil(duration / 15);
      
      for (let i = 0; i < slotsNeeded; i++) {
        const slotTime = new Date(d.getTime() + (i * 15 * 60 * 1000));
        const adjusted = new Date(slotTime.getTime() - (offset * 60 * 1000));
        const hour = adjusted.getUTCHours();
        const min = adjusted.getUTCMinutes();
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayMin = min.toString().padStart(2, "0");
        const timeKey = `${displayHour}:${displayMin} ${period}`;
        
        if (!timeSlotBookings.has(timeKey)) {
          timeSlotBookings.set(timeKey, new Set());
        }
        timeSlotBookings.get(timeKey)!.add(b.staffId);
      }
    });

    // A time is only "booked" if ALL qualified staff are busy at that time
    const bookedTimes: string[] = [];
    timeSlotBookings.forEach((bookedStaffIds, timeKey) => {
      if (bookedStaffIds.size >= staffIds.length) {
        bookedTimes.push(timeKey);
      }
    });

    return NextResponse.json({ bookedTimes });
  } catch (error) {
    console.error("Error checking bookings:", error);
    return NextResponse.json(
      { error: "Failed to check bookings" },
      { status: 500 }
    );
  }
}

function getBookedTimesFromBookings(
  bookings: { appointmentTime: Date; service: { durationMinutes: number } }[],
  offset: number
): string[] {
  const bookedTimes: string[] = [];
  
  bookings.forEach((b) => {
    const d = new Date(b.appointmentTime);
    const duration = b.service.durationMinutes;
    const slotsNeeded = Math.ceil(duration / 15);
    
    for (let i = 0; i < slotsNeeded; i++) {
      const slotTime = new Date(d.getTime() + (i * 15 * 60 * 1000));
      const adjusted = new Date(slotTime.getTime() - (offset * 60 * 1000));
      const hour = adjusted.getUTCHours();
      const min = adjusted.getUTCMinutes();
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayMin = min.toString().padStart(2, "0");
      bookedTimes.push(`${displayHour}:${displayMin} ${period}`);
    }
  });
  
  return bookedTimes;
}