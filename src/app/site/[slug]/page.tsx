import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: {
      services: true,
      hours: {
        orderBy: { day: 'asc' },
      },
      staff: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      galleryImages: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!demo) {
    notFound();
  }

  return <LandingPage demo={demo} />;
}