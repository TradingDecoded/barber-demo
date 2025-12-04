import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { demoId, hours } = body;

    if (!demoId || !hours) {
      return NextResponse.json(
        { error: "demoId and hours are required" },
        { status: 400 }
      );
    }

    // Delete existing hours and create new ones
    await prisma.businessHours.deleteMany({
      where: { demoId },
    });

    const created = await prisma.businessHours.createMany({
      data: hours.map((h: { day: number; isOpen: boolean; openTime: string; closeTime: string }) => ({
        demoId,
        day: h.day,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
      })),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error("Error saving hours:", error);
    return NextResponse.json(
      { error: "Failed to save hours" },
      { status: 500 }
    );
  }
}