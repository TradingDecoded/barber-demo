import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateSlug(shopName: string): string {
  return shopName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 30)
    + "-" + Math.random().toString(36).substring(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopName, ownerName, email, phone } = body;

    if (!shopName || !ownerName || !email || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(shopName);

    const demo = await prisma.demo.create({
      data: {
        slug,
        shopName,
        ownerName,
        email,
        phone,
        services: {
          create: [
            { name: "Haircut", durationMinutes: 30, price: 35 },
            { name: "Haircut & Beard", durationMinutes: 45, price: 50 },
            { name: "Beard Trim", durationMinutes: 20, price: 20 },
            { name: "Hot Towel Shave", durationMinutes: 40, price: 40 },
            { name: "Kids Cut", durationMinutes: 25, price: 25 },
          ],
        },
      },
    });

    return NextResponse.json({ slug: demo.slug, id: demo.id });
  } catch (error) {
    console.error("Error creating demo:", error);
    return NextResponse.json(
      { error: "Failed to create demo" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { demoId, bookingWindowDays, colorPalette } = body;

    if (!demoId) {
      return NextResponse.json({ error: "Demo ID required" }, { status: 400 });
    }

    const updateData: { bookingWindowDays?: number; colorPalette?: string; onboarded?: boolean; tourCompleted?: boolean } = {};
    if (bookingWindowDays !== undefined) updateData.bookingWindowDays = bookingWindowDays;
    if (colorPalette !== undefined) updateData.colorPalette = colorPalette;
    if (body.onboarded !== undefined) updateData.onboarded = body.onboarded;
    if (body.tourCompleted !== undefined) updateData.tourCompleted = body.tourCompleted;

    const demo = await prisma.demo.update({
      where: { id: demoId },
      data: updateData,
    });

    return NextResponse.json({ success: true, demo });
  } catch (error) {
    console.error("Error updating demo:", error);
    return NextResponse.json({ error: "Failed to update demo" }, { status: 500 });
  }
}