import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RescheduleBooking from "@/components/RescheduleBooking";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReschedulePage({ params }: PageProps) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      demo: {
        include: {
          hours: true,
          blockedDates: true,
          staff: {
            where: { isActive: true },
            include: { hours: true },
          },
        },
      },
      service: true,
      staff: true,
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.status !== "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Cannot Reschedule</h1>
          <p className="text-gray-400">
            This booking is {booking.status} and cannot be rescheduled.
          </p>
        </div>
      </div>
    );
  }

  if (new Date(booking.appointmentTime) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Appointment Passed</h1>
          <p className="text-gray-400">
            This appointment has already passed and cannot be rescheduled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <RescheduleBooking
          booking={{
            id: booking.id,
            manageToken: booking.manageToken!,
            appointmentTime: booking.appointmentTime.toISOString(),
            service: {
              id: booking.service.id,
              name: booking.service.name,
              durationMinutes: booking.service.durationMinutes,
            },
            staff: booking.staff
              ? { id: booking.staff.id, name: booking.staff.name }
              : null,
            demo: {
              id: booking.demo.id,
              slug: booking.demo.slug,
              shopName: booking.demo.shopName,
              bookingWindowDays: booking.demo.bookingWindowDays,
              hours: booking.demo.hours,
              blockedDates: booking.demo.blockedDates.map((b) => ({
                date: b.date.toISOString(),
                reason: b.reason,
              })),
            },
          }}
        />
      </div>
    </div>
  );
}