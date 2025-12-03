import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { demoId, name, durationMinutes, price } = body;

    if (!demoId || !name || !durationMinutes || !price) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        demoId,
        name,
        durationMinutes: parseInt(durationMinutes),
        price: parseInt(price),
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}