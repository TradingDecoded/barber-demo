import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ManageBooking from "@/components/ManageBooking";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ManageBookingPage({ params }: PageProps) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      demo: true,
      service: true,
      staff: true,
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <ManageBooking
          booking={{
            id: booking.id,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            appointmentTime: booking.appointmentTime.toISOString(),
            status: booking.status,
            manageToken: booking.manageToken!,
            service: {
              id: booking.service.id,
              name: booking.service.name,
              durationMinutes: booking.service.durationMinutes,
              price: booking.service.price,
            },
            staff: booking.staff
              ? { id: booking.staff.id, name: booking.staff.name }
              : null,
            demo: {
              id: booking.demo.id,
              slug: booking.demo.slug,
              shopName: booking.demo.shopName,
              phone: booking.demo.phone,
              logoUrl: booking.demo.logoUrl,
            },
          }}
        />
      </div>
    </div>
  );
}