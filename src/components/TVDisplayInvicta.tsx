"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  customerName: string;
  appointmentTime: string;
  status: string;
  service: {
    name: string;
    durationMinutes: number;
  };
  staff: { id: string; name: string } | null;
}

interface Staff {
  id: string;
  name: string;
}

interface Demo {
  id: string;
  slug: string;
  shopName: string;
  logoUrl: string | null;
  staff: Staff[];
  bookings: Booking[];
}

interface Props {
  demo: Demo;
}

export default function TVDisplayInvicta({ demo }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>(demo.bookings);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?demoId=${demo.id}`);
        if (res.ok) {
          const data = await res.json();
          const activeBookings = data.filter((b: Booking) => b.status !== "cancelled");
          setBookings(activeBookings);
        }
      } catch (e) {
        console.error("Failed to refresh bookings:", e);
      }
    };

    const interval = setInterval(refreshBookings, 60000);
    return () => clearInterval(interval);
  }, [demo.id]);

  const today = new Date();
  const todayStr = today.toDateString();

  const filteredBookings = selectedStaffId
    ? bookings.filter((b) => b.staff?.id === selectedStaffId || b.staff === null)
    : bookings;

  const todaysBookings = filteredBookings.filter(
    (b) => new Date(b.appointmentTime).toDateString() === todayStr
  );

  const upcomingToday = todaysBookings.filter(
    (b) => new Date(b.appointmentTime) >= currentTime
  );

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEndTime = (dateStr: string, duration: number) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== bookingId));
      }
    } catch (e) {
      console.error("Failed to complete booking:", e);
    }
    setActionLoading(null);
  };

  const handleNoShow = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "noshow" }),
      });
      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== bookingId));
      }
    } catch (e) {
      console.error("Failed to mark no-show:", e);
    }
    setActionLoading(null);
  };

  const currentAppointments = todaysBookings.filter((b) => {
    const start = new Date(b.appointmentTime);
    const end = new Date(start.getTime() + b.service.durationMinutes * 60000);
    const isActive = b.status === "confirmed";
    return currentTime >= start && currentTime < end && isActive;
  });

  const nextAppointment = upcomingToday.find(
    (b) => new Date(b.appointmentTime) > currentTime
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      {/* Decorative corner elements */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-[#C9A227]/30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-[#C9A227]/30 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-[#C9A227]/30 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-[#C9A227]/30 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          {demo.logoUrl ? (
            <img src={demo.logoUrl} alt={demo.shopName} className="h-20 max-w-[250px] object-contain" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center">
              <span className="font-bebas text-4xl text-[#0A0A0A]">{demo.shopName.charAt(0)}</span>
            </div>
          )}
          <div>
            <h1 className="font-cinzel text-4xl text-[#F5F0E6] tracking-wider">{demo.shopName}</h1>
            <p className="font-cormorant text-[#8B7355] text-xl mt-1">
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bebas text-7xl text-[#C9A227] tracking-wide">
            {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </div>
          <p className="font-cormorant text-[#8B7355] text-xl mt-1">{todaysBookings.length} appointments today</p>
        </div>
      </header>

      {/* Staff Filter */}
      {demo.staff.length > 0 && (
        <div className="flex items-center gap-4 mb-8">
          <span className="font-cormorant text-[#8B7355] text-lg">Filter by barber:</span>
          <button
            onClick={() => setSelectedStaffId(null)}
            className={`font-cinzel text-sm tracking-wider px-5 py-2 transition-all ${
              selectedStaffId === null
                ? "bg-[#C9A227] text-[#0A0A0A]"
                : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:border-[#C9A227] hover:text-[#C9A227]"
            }`}
          >
            All
          </button>
          {demo.staff.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStaffId(s.id)}
              className={`font-cinzel text-sm tracking-wider px-5 py-2 transition-all ${
                selectedStaffId === s.id
                  ? "bg-[#C9A227] text-[#0A0A0A]"
                  : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:border-[#C9A227] hover:text-[#C9A227]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current / Next Up */}
        <div className="col-span-1 space-y-6">
          {currentAppointments.length > 0 ? (
            <div className="space-y-4">
              <p className="font-cinzel text-sm tracking-widest text-[#C9A227]">NOW SERVING</p>
              {currentAppointments.map((appt) => (
                <div key={appt.id} className="bg-[#141414] border-2 border-[#C9A227] p-6">
                  <h2 className="font-cinzel text-3xl text-[#F5F0E6] mb-2">{appt.customerName}</h2>
                  <p className="font-cormorant text-xl text-[#8B7355]">{appt.service.name}</p>
                  {appt.staff && <p className="font-cormorant text-[#C9A227] text-lg">with {appt.staff.name}</p>}
                  <p className="font-cormorant text-[#8B7355] mt-3">
                    {formatTime(appt.appointmentTime)} - {getEndTime(appt.appointmentTime, appt.service.durationMinutes)}
                  </p>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => handleComplete(appt.id)}
                      disabled={actionLoading === appt.id}
                      className="flex-1 font-cinzel text-sm tracking-wider px-4 py-3 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === appt.id ? "..." : "✓ Complete"}
                    </button>
                    <button
                      onClick={() => handleNoShow(appt.id)}
                      disabled={actionLoading === appt.id}
                      className="flex-1 font-cinzel text-sm tracking-wider px-4 py-3 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === appt.id ? "..." : "✗ No Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#C9A227]/20 p-6">
              <p className="font-cinzel text-sm tracking-widest text-[#8B7355] mb-3">NOW SERVING</p>
              <h2 className="font-cinzel text-2xl text-[#8B7355]">No current appointment</h2>
            </div>
          )}

          {nextAppointment && (
            <div className="bg-[#141414] border border-[#C9A227]/40 p-6">
              <p className="font-cinzel text-sm tracking-widest text-[#C9A227]/70 mb-3">UP NEXT</p>
              <h2 className="font-cinzel text-2xl text-[#F5F0E6] mb-2">{nextAppointment.customerName}</h2>
              <p className="font-cormorant text-xl text-[#8B7355]">{nextAppointment.service.name}</p>
              {nextAppointment.staff && <p className="font-cormorant text-[#C9A227] text-lg">with {nextAppointment.staff.name}</p>}
              <p className="font-bebas text-3xl text-[#C9A227] mt-4">{formatTime(nextAppointment.appointmentTime)}</p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-[#141414] border border-[#C9A227]/20 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-2xl text-[#F5F0E6] tracking-wider">Today&apos;s Schedule</h2>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
            </div>
            {todaysBookings.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-cormorant text-2xl text-[#8B7355]">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
                {todaysBookings.map((booking) => {
                  const isPast = new Date(booking.appointmentTime) < currentTime;
                  const isCurrent = currentAppointments.some((c) => c.id === booking.id);
                  const isNoShow = booking.status === "noshow";
                  const isCompleted = booking.status === "completed" || (isPast && booking.status === "confirmed");
                  const isDone = isNoShow || isCompleted;
                  return (
                    <div
                      key={booking.id}
                      className={`flex items-center gap-6 p-5 transition-all ${
                        isCurrent && !isDone
                          ? "bg-[#C9A227]/10 border-l-4 border-[#C9A227]"
                          : isDone
                          ? "bg-[#0A0A0A]/50 opacity-50"
                          : "bg-[#0A0A0A] border-l-4 border-transparent hover:border-[#C9A227]/50"
                      }`}
                    >
                      <div className="w-28 text-center">
                        <p className={`font-bebas text-2xl ${
                          isCurrent && !isDone 
                            ? "text-[#C9A227]" 
                            : isNoShow 
                            ? "text-orange-400" 
                            : isDone 
                            ? "text-[#8B7355]/50" 
                            : "text-[#C9A227]"
                        }`}>
                          {formatTime(booking.appointmentTime)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className={`font-cinzel text-lg tracking-wide ${isDone ? "text-[#8B7355]/50" : "text-[#F5F0E6]"}`}>
                          {booking.customerName}
                        </p>
                        <p className={`font-cormorant text-base ${isDone ? "text-[#8B7355]/30" : "text-[#8B7355]"}`}>
                          {booking.service.name} • {booking.service.durationMinutes} min {booking.staff ? `• ${booking.staff.name}` : ""}
                        </p>
                      </div>
                      {isCurrent && !isDone && (
                        <div className="font-cinzel text-xs tracking-widest px-4 py-2 bg-[#C9A227] text-[#0A0A0A]">
                          IN PROGRESS
                        </div>
                      )}
                      {isNoShow && (
                        <div className="font-cinzel text-xs tracking-widest px-4 py-2 border border-orange-500/50 text-orange-400">
                          NO SHOW
                        </div>
                      )}
                      {isCompleted && !isNoShow && (
                        <div className="font-cinzel text-xs tracking-widest px-4 py-2 border border-[#8B7355]/30 text-[#8B7355]/50">
                          COMPLETED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center">
        <div className="inline-flex items-center gap-4">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C9A227]/50" />
          <p className="font-cormorant text-[#8B7355] text-lg">
            Book your appointment at <span className="text-[#C9A227]">{typeof window !== "undefined" ? window.location.origin : ""}/demo/{demo.slug}</span>
          </p>
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C9A227]/50" />
        </div>
      </footer>
    </div>
  );
}