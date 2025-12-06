import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const { staffId } = await params;
  const body = await request.json();

  // Delete existing service assignments and recreate
  await prisma.staffService.deleteMany({ where: { staffId } });

  if (body.serviceIds && body.serviceIds.length > 0) {
    await prisma.staffService.createMany({
      data: body.serviceIds.map((serviceId: string) => ({
        staffId,
        serviceId,
      }))
    });
  }

  const updatedStaff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      hours: true,
      services: { include: { service: true } }
    }
  });

  return NextResponse.json(updatedStaff);
}