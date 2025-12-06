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

export default function TVDisplay({ demo }: Props) {
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

  const completedToday = todaysBookings.filter(
    (b) => new Date(b.appointmentTime) < currentTime
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

  const currentAppointment = currentAppointments[0] || null;

  const nextAppointment = upcomingToday.find(
    (b) => new Date(b.appointmentTime) > currentTime
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {demo.logoUrl ? (
            <img src={demo.logoUrl} alt={demo.shopName} className="h-16 max-w-[200px] object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {demo.shopName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{demo.shopName}</h1>
            <p className="text-gray-400">
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-white font-mono">
            {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </div>
          <p className="text-gray-400 mt-1">{todaysBookings.length} appointments today</p>
        </div>
      </header>

      {/* Staff Filter */}
      {demo.staff.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-gray-400 text-sm">Filter by barber:</span>
          <button
            onClick={() => setSelectedStaffId(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStaffId === null
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
          >
            All
          </button>
          {demo.staff.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStaffId(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStaffId === s.id
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
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
              <p className="text-green-400 text-sm font-medium">NOW SERVING</p>
              {currentAppointments.map((appt) => (
                <div key={appt.id} className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{appt.customerName}</h2>
                  <p className="text-lg text-gray-300">{appt.service.name}</p>
                  {appt.staff && <p className="text-purple-400">with {appt.staff.name}</p>}
                  <p className="text-gray-400 text-sm mt-2">
                    {formatTime(appt.appointmentTime)} - {getEndTime(appt.appointmentTime, appt.service.durationMinutes)}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleComplete(appt.id)}
                      disabled={actionLoading === appt.id}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === appt.id ? "..." : "✓ Complete"}
                    </button>
                    <button
                      onClick={() => handleNoShow(appt.id)}
                      disabled={actionLoading === appt.id}
                      className="flex-1 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === appt.id ? "..." : "✗ No Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-500 text-sm font-medium mb-2">NOW SERVING</p>
              <h2 className="text-2xl text-gray-500">No current appointment</h2>
            </div>
          )}

          {nextAppointment && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6">
              <p className="text-purple-400 text-sm font-medium mb-2">UP NEXT</p>
              <h2 className="text-2xl font-bold text-white mb-2">{nextAppointment.customerName}</h2>
              <p className="text-lg text-gray-300">{nextAppointment.service.name}</p>
              {nextAppointment.staff && <p className="text-purple-400">with {nextAppointment.staff.name}</p>}
              <p className="text-gray-400 mt-2">{formatTime(nextAppointment.appointmentTime)}</p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-4">Today&apos;s Schedule</h2>
            {todaysBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {todaysBookings.map((booking) => {
                  const isPast = new Date(booking.appointmentTime) < currentTime;
                  const isCurrent = currentAppointments.some((c) => c.id === booking.id);
                  const isNoShow = booking.status === "noshow";
                  const isCompleted = booking.status === "completed" || (isPast && booking.status === "confirmed");
                  const isDone = isNoShow || isCompleted;
                  return (
                    <div
                      key={booking.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isCurrent && !isDone
                          ? "bg-green-500/20 border border-green-500/30"
                          : isDone
                            ? "bg-white/5 opacity-50"
                            : "bg-white/10"
                        }`}
                    >
                      <div className="w-24 text-center">
                        <p className={`text-lg font-mono ${isCurrent && !isDone ? "text-green-400" : isNoShow ? "text-orange-400" : isDone ? "text-gray-500" : "text-purple-400"}`}>
                          {formatTime(booking.appointmentTime)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isDone ? "text-gray-500" : "text-white"}`}>
                          {booking.customerName}
                        </p>
                        <p className={`text-sm ${isDone ? "text-gray-600" : "text-gray-400"}`}>
                          {booking.service.name} • {booking.service.durationMinutes} min {booking.staff ? `• ${booking.staff.name}` : ""}
                        </p>
                      </div>
                      {isCurrent && !isDone && (
                        <div className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                          In Progress
                        </div>
                      )}
                      {isNoShow && (
                        <div className="px-3 py-1 bg-orange-500/80 text-white text-sm font-medium rounded-full">
                          No Show
                        </div>
                      )}
                      {isCompleted && !isNoShow && (
                        <div className="px-3 py-1 bg-gray-700 text-gray-400 text-sm rounded-full">
                          Completed
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
      <footer className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Book your appointment at <span className="text-purple-400">{typeof window !== "undefined" ? window.location.origin : ""}/demo/{demo.slug}</span>
        </p>
      </footer>
    </div>
  );
}