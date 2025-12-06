import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import OnboardingWrapper from "@/components/OnboardingWrapper";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      services: true,
      hours: true,
      blockedDates: true,
      staff: {
        orderBy: { sortOrder: 'asc' },
        include: {
          hours: true,
          services: { include: { service: true } },
        },
      },
      bookings: {
        include: {
          service: true,
          staff: true,
        },
        orderBy: {
          appointmentTime: "asc",
        },
      },
    },
  });

  if (!demo) {
    notFound();
  }

  const serializedDemo = {
    ...demo,
    createdAt: demo.createdAt.toISOString(),
    services: demo.services.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
    hours: demo.hours.map((h) => ({
      id: h.id,
      day: h.day,
      isOpen: h.isOpen,
      openTime: h.openTime,
      closeTime: h.closeTime,
    })),
    blockedDates: demo.blockedDates.map((b) => ({
      id: b.id,
      date: b.date.toISOString(),
      reason: b.reason,
    })),
    bookings: demo.bookings.map((b) => ({
      ...b,
      appointmentTime: b.appointmentTime.toISOString(),
      createdAt: b.createdAt.toISOString(),
      service: {
        ...b.service,
        createdAt: b.service.createdAt.toISOString(),
      },
      staff: b.staff ? { id: b.staff.id, name: b.staff.name, photoUrl: b.staff.photoUrl } : null,
    })),
    staff: demo.staff.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      hours: s.hours,
      services: s.services,
    })),
  };

  if (!demo.onboarded) {
    return <OnboardingWrapper demo={serializedDemo} />;
  }

  return <AdminDashboard demo={serializedDemo} />;
}