import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    select: {
      id: true,
      shopName: true,
      phone: true,
      logoUrl: true,
      accentColor: true,
      tagline: true,
      heroSubtitle: true,
      heroImageUrl: true,
      aboutTitle: true,
      aboutText1: true,
      aboutText2: true,
      aboutSignature: true,
      aboutImageUrl: true,
      address: true,
      instagramUrl: true,
      facebookUrl: true,
      hours: {
        orderBy: { day: "asc" },
      },
      services: {
        orderBy: { name: "asc" },
      },
      staff: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      galleryImages: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!demo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(demo);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const allowedFields = [
    "tagline",
    "heroSubtitle",
    "heroImageUrl",
    "aboutTitle",
    "aboutText1",
    "aboutText2",
    "aboutSignature",
    "aboutImageUrl",
    "address",
    "instagramUrl",
    "facebookUrl",
  ];

  const updateData: Record<string, string | null> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const demo = await prisma.demo.update({
    where: { slug },
    data: updateData,
  });

  return NextResponse.json(demo);
}