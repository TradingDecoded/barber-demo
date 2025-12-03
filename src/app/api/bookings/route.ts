import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

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

    const booking = await prisma.booking.create({
      data: {
        demoId,
        serviceId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        appointmentTime: new Date(appointmentTime),
      },
    });

    const appointmentDate = new Date(appointmentTime);
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

    // Send confirmation SMS to customer
    await sendSMS(
      customerPhone,
      `✅ Booking confirmed!\n\n${service.name} at ${demo.shopName}\n📅 ${formattedDate}\n⏰ ${formattedTime}\n\nSee you then!`
    );

    // Send alert SMS to barber/owner
    await sendSMS(
      demo.phone,
      `📅 New booking!\n\n${customerName} booked a ${service.name}\n📅 ${formattedDate}\n⏰ ${formattedTime}\n📱 ${customerPhone}`
    );

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}