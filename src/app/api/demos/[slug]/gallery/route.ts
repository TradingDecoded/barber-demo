import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!demo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const images = await prisma.galleryImage.findMany({
    where: { demoId: demo.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const demo = await prisma.demo.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!demo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const maxOrder = await prisma.galleryImage.findFirst({
    where: { demoId: demo.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const image = await prisma.galleryImage.create({
    data: {
      demoId: demo.id,
      imageUrl: body.imageUrl,
      altText: body.altText || null,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(image);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("id");

  if (!imageId) {
    return NextResponse.json({ error: "Missing image id" }, { status: 400 });
  }

  await prisma.galleryImage.delete({
    where: { id: imageId },
  });

  return NextResponse.json({ success: true });
}