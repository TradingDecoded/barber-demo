import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: { services: true, hours: true },
  });

  if (!demo) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {demo.logoUrl ? (
              <img src={demo.logoUrl} alt={demo.shopName} className="h-10 max-w-[120px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {demo.shopName.charAt(0)}
              </div>
            )}
            <span className="text-xl font-semibold text-white">{demo.shopName}</span>
          </div>
          <div className="text-sm text-purple-400 glass-card px-3 py-1 rounded-full">
            AI Demo
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book Your Appointment at{" "}
            <span className="gradient-text">{demo.shopName}</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Select a service and pick a time that works for you. You&apos;ll receive instant confirmation via SMS.
          </p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <BookingForm demo={demo} services={demo.services} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            This is a demo powered by{" "}
            <a href="https://ai.jdemar.com" className="text-purple-400 hover:underline">
              BizHelper.AI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}