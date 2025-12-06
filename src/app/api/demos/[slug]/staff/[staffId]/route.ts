import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const { staffId } = await params;

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      hours: true,
      services: { include: { service: true } }
    }
  });

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  }

  return NextResponse.json(staff);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const { staffId } = await params;
  const body = await request.json();

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: {
      name: body.name,
      phone: body.phone || null,
      photoUrl: body.photoUrl || null,
      bio: body.bio || null,
      isActive: body.isActive,
    },
    include: {
      hours: true,
      services: { include: { service: true } }
    }
  });

  return NextResponse.json(staff);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; staffId: string }> }
) {
  const { staffId } = await params;

  // Check if staff has any bookings
  const bookingCount = await prisma.booking.count({
    where: { staffId }
  });

  if (bookingCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete staff with existing bookings. Deactivate instead.' },
      { status: 400 }
    );
  }

  await prisma.staff.delete({ where: { id: staffId } });

  return NextResponse.json({ success: true });
}