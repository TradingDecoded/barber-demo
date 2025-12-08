import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import BookingFormInvicta from "@/components/BookingFormInvicta";
import WalkInAvailability from "@/components/WalkInAvailability";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;

  const demo = await prisma.demo.findUnique({
    where: { slug },
    include: { 
      services: true, 
      hours: true, 
      blockedDates: true,
      staff: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          hours: true,
          services: { include: { service: true } },
        },
      },
    },
  });

  if (!demo) {
    notFound();
  }

  // Check if this is the Invicta barbershop (use themed version)
  const isInvicta = slug === "invicta-barbershop";

  const demoData = {
    ...demo, 
    blockedDates: demo.blockedDates.map(b => ({ date: b.date.toISOString(), reason: b.reason }))
  };

  const staffData = demo.staff.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  if (isInvicta) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Invicta Header */}
        <header className="border-b border-[#C9A227]/20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-xl tracking-widest text-[#C9A227]">INVICTA</span>
            </div>
            <a 
              href="/site/invicta-barbershop.html" 
              className="font-cinzel text-xs tracking-widest uppercase text-[#8B7355] hover:text-[#C9A227] transition-colors"
            >
              ← Back to Site
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-cinzel text-xs tracking-[0.3em] uppercase text-[#C9A227] mb-4">Online Booking</p>
            <h1 className="font-bebas text-5xl md:text-6xl text-[#F5F0E6] mb-4 tracking-wide">
              BOOK YOUR APPOINTMENT
            </h1>
            <p className="font-cormorant text-[#F5F0E6]/70 text-xl italic">
              Select a service and pick a time that works for you. Instant confirmation via SMS.
            </p>
          </div>
        </section>

        {/* Booking Section */}
        <section className="pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <WalkInAvailability demoId={demo.id} />
            <BookingFormInvicta 
              demo={demoData} 
              services={demo.services} 
              staff={staffData}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#C9A227]/20 py-8 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-cormorant text-[#8B7355] text-sm">
              Powered by{" "}
              <a href="https://ai.jdemar.com" className="text-[#C9A227] hover:text-[#D4AF37]">
                BizHelper.AI
              </a>
            </p>
          </div>
        </footer>
      </div>
    );
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
          <WalkInAvailability demoId={demo.id} />
          <BookingForm 
            demo={demoData} 
            services={demo.services} 
            staff={staffData}
          />
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