import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const { staffId } = await params;
  const body = await request.json();

  // Delete existing hours and recreate
  await prisma.staffHours.deleteMany({ where: { staffId } });

  const hours = await prisma.staffHours.createMany({
    data: body.hours.map((h: { day: number; isOpen: boolean; openTime: string; closeTime: string }) => ({
      staffId,
      day: h.day,
      isOpen: h.isOpen,
      openTime: h.openTime,
      closeTime: h.closeTime,
    }))
  });

  const updatedStaff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { hours: true }
  });

  return NextResponse.json(updatedStaff);
}