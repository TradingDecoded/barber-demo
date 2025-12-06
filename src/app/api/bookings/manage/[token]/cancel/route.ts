import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await prisma.booking.findUnique({
      where: { manageToken: token },
      include: {
        demo: true,
        service: true,
        staff: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Booking cannot be cancelled" },
        { status: 400 }
      );
    }

    // Check if appointment is in the past
    if (new Date(booking.appointmentTime) < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel past appointments" },
        { status: 400 }
      );
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    // Format appointment details for SMS
    const appointmentDate = new Date(booking.appointmentTime);
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

    // Notify shop owner
    const ownerMessage = `❌ Booking cancelled\n\n${booking.customerName} cancelled their ${booking.service.name} appointment${booking.staff ? ` with ${booking.staff.name}` : ""}\n📅 ${formattedDate}\n⏰ ${formattedTime}\n📱 ${booking.customerPhone}`;

    await sendSMS(booking.demo.phone, ownerMessage);

    // Confirm to customer
    const customerMessage = `Your ${booking.service.name} appointment at ${booking.demo.shopName} on ${formattedDate} at ${formattedTime} has been cancelled.\n\nBook again anytime at: https://barber-demo.ai.jdemar.com/demo/${booking.demo.slug}`;

    await sendSMS(booking.customerPhone, customerMessage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}