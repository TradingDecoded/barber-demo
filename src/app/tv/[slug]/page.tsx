import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TVDisplay from "@/components/TVDisplay";
import TVDisplayInvicta from "@/components/TVDisplayInvicta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TVPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      services: true,
      staff: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      bookings: {
        where: {
          status: { not: "cancelled" },
        },
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
    id: demo.id,
    slug: demo.slug,
    shopName: demo.shopName,
    logoUrl: demo.logoUrl,
    staff: demo.staff.map((s) => ({
      id: s.id,
      name: s.name,
    })),
    bookings: demo.bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      appointmentTime: b.appointmentTime.toISOString(),
      status: b.status,
      service: {
        name: b.service.name,
        durationMinutes: b.service.durationMinutes,
      },
      staff: b.staff ? { id: b.staff.id, name: b.staff.name } : null,
    })),
  };

  if (slug === "invicta-barbershop") {
    return <TVDisplayInvicta demo={serializedDemo} />;
  }

  return <TVDisplay demo={serializedDemo} />;
}