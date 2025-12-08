import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const demoId = request.nextUrl.searchParams.get("demoId");
  const status = request.nextUrl.searchParams.get("status");

  if (!demoId) {
    return NextResponse.json({ error: "Missing demoId" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      demoId,
      ...(status ? { status } : {}),
    },
    include: {
      service: true,
      staff: true,
    },
    orderBy: {
      appointmentTime: "asc",
    },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      appointmentTime: b.appointmentTime.toISOString(),
      status: b.status,
      reminderSent: b.reminderSent,
      reviewSent: b.reviewSent,
      wasAutoAssigned: b.wasAutoAssigned,
      createdAt: b.createdAt.toISOString(),
      service: {
        id: b.service.id,
        name: b.service.name,
        durationMinutes: b.service.durationMinutes,
        price: b.service.price,
      },
      staff: b.staff ? { id: b.staff.id, name: b.staff.name } : null,
    }))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      demoId,
      serviceId,
      staffId,
      customerName,
      customerPhone,
      customerEmail,
      appointmentTime,
      recurring = "none",
      recurringCount = 1,
    } = body;

    if (!demoId || !serviceId || !customerName || !customerPhone || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const demo = await prisma.demo.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      return NextResponse.json(
        { error: "Demo not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const bookings = [];
    const recurringGroupId = recurring !== "none" ? uuidv4() : null;
    const baseDate = new Date(appointmentTime);

    // Auto-assign staff if "Any Available" was selected
    let assignedStaffId = staffId || null;
    let wasAutoAssigned = false;

    if (!staffId) {
      // Find all active staff who can perform this service
      const availableStaff = await prisma.staff.findMany({
        where: {
          demoId,
          isActive: true,
          services: {
            some: {
              serviceId,
            },
          },
        },
        include: {
          bookings: {
            where: {
              appointmentTime: {
                gte: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
                lte: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
              },
              status: {
                not: "cancelled",
              },
            },
          },
        },
      });

      if (availableStaff.length > 0) {
        // Sort by number of bookings (least busy first)
        availableStaff.sort((a, b) => a.bookings.length - b.bookings.length);
        assignedStaffId = availableStaff[0].id;
        wasAutoAssigned = true;
      }
    }

    for (let i = 0; i < recurringCount; i++) {
      const apptDate = new Date(baseDate);

      if (recurring === "weekly") {
        apptDate.setDate(baseDate.getDate() + (i * 7));
      } else if (recurring === "biweekly") {
        apptDate.setDate(baseDate.getDate() + (i * 14));
      } else if (recurring === "monthly") {
        apptDate.setMonth(baseDate.getMonth() + i);
      }

      const manageToken = crypto.randomBytes(16).toString("hex");
      
      const booking = await prisma.booking.create({
        data: {
          demoId,
          serviceId,
          staffId: assignedStaffId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          appointmentTime: apptDate,
          recurringGroupId,
          recurringType: recurring !== "none" ? recurring : null,
          manageToken,
          wasAutoAssigned,
        },
      });

      bookings.push(booking);
    }

    const firstAppt = bookings[0];
    const appointmentDate = new Date(firstAppt.appointmentTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Get staff name if staff was assigned
    let staffName = null;
    if (assignedStaffId) {
      const staff = await prisma.staff.findUnique({ where: { id: assignedStaffId } });
      staffName = staff?.name;
    }

    const manageUrl = `https://barber-demo.ai.jdemar.com/manage/${firstAppt.manageToken}`;
    let customerMessage = `✅ Booking confirmed!\n\n${service.name} at ${demo.shopName}${staffName ? `\n💈 with ${staffName}` : ''}\n📅 ${formattedDate}\n⏰ ${formattedTime}`;
    let ownerMessage = `📅 New booking!\n\n${customerName} booked a ${service.name}${staffName ? ` with ${staffName}` : ''}\n📅 ${formattedDate}\n⏰ ${formattedTime}\n📱 ${customerPhone}`;

    if (recurring !== "none") {
      customerMessage += `\n\n🔄 Repeating ${recurring} for ${recurringCount} appointments`;
      ownerMessage += `\n\n🔄 Recurring: ${recurring} × ${recurringCount}`;
    }

    customerMessage += `\n\nManage your booking: ${manageUrl}`;

    await sendSMS(customerPhone, customerMessage);
    await sendSMS(demo.phone, ownerMessage);

    return NextResponse.json({
      success: true,
      bookingId: firstAppt.id,
      totalBookings: bookings.length,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}