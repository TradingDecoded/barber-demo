"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  customerName: string;
  appointmentTime: string;
  service: {
    name: string;
    durationMinutes: number;
  };
}

interface Demo {
  id: string;
  slug: string;
  shopName: string;
  logoUrl: string | null;
  bookings: Booking[];
}

interface Props {
  demo: Demo;
}

export default function TVDisplay({ demo }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>(demo.bookings);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?demoId=${demo.id}&status=confirmed`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
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

  const todaysBookings = bookings.filter(
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

  const currentAppointment = todaysBookings.find((b) => {
    const start = new Date(b.appointmentTime);
    const end = new Date(start.getTime() + b.service.durationMinutes * 60000);
    return currentTime >= start && currentTime < end;
  });

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

      <div className="grid grid-cols-3 gap-8">
        {/* Current / Next Up */}
        <div className="col-span-1 space-y-6">
          {currentAppointment ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
              <p className="text-green-400 text-sm font-medium mb-2">NOW SERVING</p>
              <h2 className="text-3xl font-bold text-white mb-2">{currentAppointment.customerName}</h2>
              <p className="text-xl text-gray-300">{currentAppointment.service.name}</p>
              <p className="text-gray-400 mt-2">
                {formatTime(currentAppointment.appointmentTime)} - {getEndTime(currentAppointment.appointmentTime, currentAppointment.service.durationMinutes)}
              </p>
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
              <p className="text-gray-400 mt-2">{formatTime(nextAppointment.appointmentTime)}</p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="col-span-2">
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
                  const isCurrent = currentAppointment?.id === booking.id;
                  return (
                    <div
                      key={booking.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isCurrent
                          ? "bg-green-500/20 border border-green-500/30"
                          : isPast
                            ? "bg-white/5 opacity-50"
                            : "bg-white/10"
                      }`}
                    >
                      <div className="w-24 text-center">
                        <p className={`text-lg font-mono ${isCurrent ? "text-green-400" : isPast ? "text-gray-500" : "text-purple-400"}`}>
                          {formatTime(booking.appointmentTime)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isPast ? "text-gray-500" : "text-white"}`}>
                          {booking.customerName}
                        </p>
                        <p className={`text-sm ${isPast ? "text-gray-600" : "text-gray-400"}`}>
                          {booking.service.name} • {booking.service.durationMinutes} min
                        </p>
                      </div>
                      {isCurrent && (
                        <div className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                          In Progress
                        </div>
                      )}
                      {isPast && !isCurrent && (
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