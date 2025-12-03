import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      services: true,
      bookings: {
        include: {
          service: true,
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
    bookings: demo.bookings.map((b) => ({
      ...b,
      appointmentTime: b.appointmentTime.toISOString(),
      createdAt: b.createdAt.toISOString(),
      service: {
        ...b.service,
        createdAt: b.service.createdAt.toISOString(),
      },
    })),
  };

  return <AdminDashboard demo={serializedDemo} />;
}