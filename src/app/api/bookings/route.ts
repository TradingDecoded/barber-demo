import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      demoId,
      serviceId,
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

    for (let i = 0; i < recurringCount; i++) {
      const apptDate = new Date(baseDate);
      
      if (recurring === "weekly") {
        apptDate.setDate(baseDate.getDate() + (i * 7));
      } else if (recurring === "biweekly") {
        apptDate.setDate(baseDate.getDate() + (i * 14));
      } else if (recurring === "monthly") {
        apptDate.setMonth(baseDate.getMonth() + i);
      }

      const booking = await prisma.booking.create({
        data: {
          demoId,
          serviceId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          appointmentTime: apptDate,
          recurringGroupId,
          recurringType: recurring !== "none" ? recurring : null,
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

    let customerMessage = `✅ Booking confirmed!\n\n${service.name} at ${demo.shopName}\n📅 ${formattedDate}\n⏰ ${formattedTime}`;
    let ownerMessage = `📅 New booking!\n\n${customerName} booked a ${service.name}\n📅 ${formattedDate}\n⏰ ${formattedTime}\n📱 ${customerPhone}`;

    if (recurring !== "none") {
      customerMessage += `\n\n🔄 Repeating ${recurring} for ${recurringCount} appointments`;
      ownerMessage += `\n\n🔄 Recurring: ${recurring} × ${recurringCount}`;
    }

    customerMessage += "\n\nSee you then!";

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