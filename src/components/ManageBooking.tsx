"use client";

import { useState } from "react";
import { downloadICSFile } from "@/lib/calendar";

interface ManageBookingProps {
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    appointmentTime: string;
    status: string;
    manageToken: string;
    service: {
      id: string;
      name: string;
      durationMinutes: number;
      price: number;
    };
    staff: { id: string; name: string } | null;
    demo: {
      id: string;
      slug: string;
      shopName: string;
      phone: string;
      logoUrl: string | null;
    };
  };
}

export default function ManageBooking({ booking }: ManageBookingProps) {
  const [status, setStatus] = useState(booking.status);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const appointmentDate = new Date(booking.appointmentTime);
  const isPast = appointmentDate < new Date();
  const isConfirmed = status === "confirmed";

  const handleAddToCalendar = () => {
    downloadICSFile({
      title: `${booking.service.name} at ${booking.demo.shopName}`,
      description: `Appointment${booking.staff ? ` with ${booking.staff.name}` : ''}. Service: ${booking.service.name} (${booking.service.durationMinutes} min, $${booking.service.price})`,
      location: booking.demo.shopName,
      startTime: appointmentDate,
      durationMinutes: booking.service.durationMinutes,
    }, `${booking.demo.shopName.replace(/\s+/g, '-')}-appointment.ics`);
  };

  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/manage/${booking.manageToken}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        setStatus("cancelled");
        setCancelled(true);
        setShowCancelConfirm(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      alert("Failed to cancel booking");
    }
    setLoading(false);
  };

  if (cancelled) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Booking Cancelled</h1>
        <p className="text-gray-400 mb-6">
          Your appointment has been cancelled. {booking.demo.shopName} has been notified.
        </p>
        <a
        href={`/demo/${booking.demo.slug}`}
          className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Book a New Appointment
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        {booking.demo.logoUrl ? (
          <img
            src={booking.demo.logoUrl}
            alt={booking.demo.shopName}
            className="h-16 mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {booking.demo.shopName.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-bold text-white">{booking.demo.shopName}</h1>
        <p className="text-gray-400">Manage Your Booking</p>
      </div>

      {/* Booking Details */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Appointment Details</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              status === "confirmed"
                ? "bg-green-500/20 text-green-400"
                : status === "cancelled"
                ? "bg-red-500/20 text-red-400"
                : status === "completed"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💇</span>
            <div>
              <p className="text-white font-medium">{booking.service.name}</p>
              <p className="text-gray-500 text-sm">
                {booking.service.durationMinutes} minutes • ${booking.service.price}
              </p>
            </div>
          </div>

          {booking.staff && (
            <div className="flex items-start gap-3">
              <span className="text-2xl">💈</span>
              <div>
                <p className="text-white font-medium">{booking.staff.name}</p>
                <p className="text-gray-500 text-sm">Your barber</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-white font-medium">{formattedDate}</p>
              <p className="text-gray-500 text-sm">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-white font-medium">{booking.customerName}</p>
              <p className="text-gray-500 text-sm">{booking.customerPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isConfirmed && !isPast && (
        <div className="space-y-3">
          <button
            onClick={handleAddToCalendar}
            className="w-full py-3 px-4 bg-white/10 text-white text-center rounded-lg hover:bg-white/20 font-medium flex items-center justify-center gap-2"
          >
            <span>📅</span>
            Add to Calendar
          </button>
          <a
            href={`/manage/${booking.manageToken}/reschedule`}
            className="block w-full py-3 px-4 bg-purple-500 text-white text-center rounded-lg hover:bg-purple-600 font-medium"
          >
            Reschedule Appointment
          </a>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full py-3 px-4 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 font-medium"
          >
            Cancel Appointment
          </button>
        </div>
      )}

      {isPast && isConfirmed && (
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-gray-400">This appointment has already passed.</p>
        </div>
      )}

      {/* Contact */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Need help? Call{" "}
          <a href={`tel:${booking.demo.phone}`} className="text-purple-400 hover:underline">
            {booking.demo.phone}
          </a>
        </p>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="glass-card rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Cancel Appointment?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to cancel your {booking.service.name} appointment on{" "}
              {formattedDate} at {formattedTime}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-4 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5"
              >
                Keep It
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}