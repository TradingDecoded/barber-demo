import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      staff: {
        orderBy: { sortOrder: 'asc' },
        include: {
          hours: true,
          services: {
            include: { service: true }
          }
        }
      }
    }
  });

  if (!demo) {
    return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
  }

  return NextResponse.json(demo.staff);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const demo = await prisma.demo.findUnique({ where: { slug } });
  if (!demo) {
    return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
  }

  const staffCount = await prisma.staff.count({ where: { demoId: demo.id } });

  const staff = await prisma.staff.create({
    data: {
      demoId: demo.id,
      name: body.name,
      phone: body.phone || null,
      photoUrl: body.photoUrl || null,
      bio: body.bio || null,
      isActive: body.isActive ?? true,
      sortOrder: staffCount,
    },
    include: {
      hours: true,
      services: { include: { service: true } }
    }
  });

  return NextResponse.json(staff);
}