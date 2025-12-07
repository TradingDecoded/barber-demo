import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { newAppointmentTime } = await request.json();

    if (!newAppointmentTime) {
      return NextResponse.json(
        { error: "New appointment time is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        manageToken: token,
        status: "confirmed",
      },
      include: {
        service: true,
        staff: true,
        demo: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or cannot be rescheduled" },
        { status: 404 }
      );
    }

    const appointmentDate = new Date(newAppointmentTime);
    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { error: "Cannot reschedule to a past time" },
        { status: 400 }
      );
    }

    const oldAppointmentTime = booking.appointmentTime;

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        appointmentTime: appointmentDate,
      },
    });

    // Format times for SMS
    const oldTimeFormatted = oldAppointmentTime.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });

    const newTimeFormatted = appointmentDate.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });

    // Send SMS to customer
    try {
      await sendSMS(
        booking.customerPhone,
        `Your ${booking.service.name} appointment at ${booking.demo.shopName} has been rescheduled from ${oldTimeFormatted} to ${newTimeFormatted}.`
      );
    } catch (smsError) {
      console.error("Failed to send customer SMS:", smsError);
    }

    // Send SMS to shop
    if (booking.demo.phone) {
      try {
        await sendSMS(
          booking.demo.phone,
          `📅 RESCHEDULED: ${booking.customerName} moved their ${booking.service.name} from ${oldTimeFormatted} to ${newTimeFormatted}.`
        );
      } catch (smsError) {
        console.error("Failed to send shop SMS:", smsError);
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json(
      { error: "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}