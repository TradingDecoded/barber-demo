import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the demo
    const demo = await prisma.demo.findUnique({
      where: { slug },
    });

    if (!demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Delete all related data in order (respecting foreign keys)
    // Note: StaffService and StaffHours cascade from Staff deletion
    // Bookings reference both Service and Staff, so delete first
    await prisma.booking.deleteMany({
      where: { demoId: demo.id },
    });

    // Delete gallery images
    await prisma.galleryImage.deleteMany({
      where: { demoId: demo.id },
    });

    // Delete blocked dates
    await prisma.blockedDate.deleteMany({
      where: { demoId: demo.id },
    });

    // Delete business hours
    await prisma.businessHours.deleteMany({
      where: { demoId: demo.id },
    });

    // Delete staff (cascades to StaffHours and StaffService)
    await prisma.staff.deleteMany({
      where: { demoId: demo.id },
    });

    // Delete services (after StaffService is gone via cascade)
    await prisma.service.deleteMany({
      where: { demoId: demo.id },
    });

    // Update demo: clear logoUrl, website content, and set onboarded to false
    await prisma.demo.update({
      where: { id: demo.id },
      data: {
        logoUrl: null,
        onboarded: false,
        tourCompleted: false,
        // Clear website content
        tagline: null,
        heroSubtitle: null,
        heroImageUrl: null,
        aboutTitle: null,
        aboutText1: null,
        aboutText2: null,
        aboutSignature: null,
        aboutImageUrl: null,
        address: null,
        instagramUrl: null,
        facebookUrl: null,
      },
    });

    // Create default services
    const defaultServices = [
      { name: 'Classic Haircut', durationMinutes: 30, price: 35 },
      { name: 'Beard Trim', durationMinutes: 20, price: 20 },
      { name: 'Hot Towel Shave', durationMinutes: 45, price: 45 },
      { name: 'Haircut & Beard Combo', durationMinutes: 45, price: 50 },
      { name: 'Kids Haircut', durationMinutes: 25, price: 25 },
    ];

    for (const service of defaultServices) {
      await prisma.service.create({
        data: {
          demoId: demo.id,
          ...service,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting demo:', error);
    return NextResponse.json(
      { error: 'Failed to reset demo' },
      { status: 500 }
    );
  }
}