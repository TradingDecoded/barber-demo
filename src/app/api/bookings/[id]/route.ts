import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, newTime } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, demo: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "cancel") {
      await prisma.booking.update({
        where: { id },
        data: { status: "cancelled" },
      });

      const formattedDate = new Date(booking.appointmentTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      await sendSMS(
        booking.customerPhone,
        `Your ${booking.service.name} appointment at ${booking.demo.shopName} on ${formattedDate} has been cancelled. Please call us to rebook.`
      );

      return NextResponse.json({ success: true });
    }

    if (action === "reschedule" && newTime) {
      const oldDate = new Date(booking.appointmentTime);
      const newDate = new Date(newTime);

      await prisma.booking.update({
        where: { id },
        data: { appointmentTime: newDate },
      });

      const oldFormatted = oldDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }) + " at " + oldDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      const newFormatted = newDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }) + " at " + newDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      await sendSMS(
        booking.customerPhone,
        `Your ${booking.service.name} at ${booking.demo.shopName} has been rescheduled.\n\nOld: ${oldFormatted}\nNew: ${newFormatted}`
      );

      return NextResponse.json({ success: true });
    }

    if (action === "complete") {
      await prisma.booking.update({
        where: { id },
        data: { status: "completed" },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "noshow") {
      await prisma.booking.update({
        where: { id },
        data: { status: "noshow" },
      });

      return NextResponse.json({ success: true });
    }

    // Handle staff reassignment (no action specified, just staffId)
    if (body.staffId !== undefined) {
      await prisma.booking.update({
        where: { id },
        data: { 
          staffId: body.staffId || null,
          wasAutoAssigned: body.wasAutoAssigned ?? false,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}