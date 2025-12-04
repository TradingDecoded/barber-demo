import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get("demoId");
    const dateStr = searchParams.get("date");
    const offsetStr = searchParams.get("offset");

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

    const bookings = await prisma.booking.findMany({
      where: {
        demoId,
        appointmentTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "confirmed",
      },
      select: {
        appointmentTime: true,
      },
    });

    const bookedTimes = bookings.map((b) => {
      const d = new Date(b.appointmentTime);
      // Adjust for client timezone
      const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
      const hour = adjusted.getUTCHours();
      const min = adjusted.getUTCMinutes();
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayMin = min.toString().padStart(2, "0");
      return `${displayHour}:${displayMin} ${period}`;
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