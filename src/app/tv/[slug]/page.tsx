import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TVDisplay from "@/components/TVDisplay";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TVPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      services: true,
      bookings: {
        where: {
          status: "confirmed",
        },
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
    id: demo.id,
    slug: demo.slug,
    shopName: demo.shopName,
    logoUrl: demo.logoUrl,
    bookings: demo.bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      appointmentTime: b.appointmentTime.toISOString(),
      service: {
        name: b.service.name,
        durationMinutes: b.service.durationMinutes,
      },
    })),
  };

  return <TVDisplay demo={serializedDemo} />;
}