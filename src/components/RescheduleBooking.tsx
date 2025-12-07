"use client";

import { useState, useEffect } from "react";

interface BusinessHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface RescheduleBookingProps {
  booking: {
    id: string;
    manageToken: string;
    appointmentTime: string;
    service: {
      id: string;
      name: string;
      durationMinutes: number;
    };
    staff: { id: string; name: string } | null;
    demo: {
      id: string;
      slug: string;
      shopName: string;
      bookingWindowDays: number;
      hours: BusinessHours[];
      blockedDates: { date: string; reason: string | null }[];
    };
  };
}

export default function RescheduleBooking({ booking }: RescheduleBookingProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const hours = booking.demo.hours;

  const getHoursForDay = (dayOfWeek: number): BusinessHours | undefined => {
    return hours.find((h) => h.day === dayOfWeek);
  };

  const getBlockedDateInfo = (date: Date): { isBlocked: boolean; reason: string | null } => {
    const blocked = booking.demo.blockedDates.find(
      (b) => new Date(b.date).toDateString() === date.toDateString()
    );
    return { isBlocked: !!blocked, reason: blocked?.reason || null };
  };

  const getAvailableDates = () => {
    const dates: { date: Date; isBlocked: boolean; reason: string | null }[] = [];
    const today = new Date();
    const windowDays = booking.demo.bookingWindowDays || 60;

    for (let i = 1; i <= windowDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayHours = getHoursForDay(date.getDay());
      if (dayHours && dayHours.isOpen) {
        const blockInfo = getBlockedDateInfo(date);
        dates.push({ date, isBlocked: blockInfo.isBlocked, reason: blockInfo.reason });
      }
    }
    return dates;
  };

  const generateTimeSlots = (dayOfWeek: number): string[] => {
    const dayHours = getHoursForDay(dayOfWeek);
    if (!dayHours || !dayHours.isOpen) return [];

    const slots: string[] = [];
    const [openHour, openMin] = dayHours.openTime.split(":").map(Number);
    const [closeHour, closeMin] = dayHours.closeTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const period = currentHour >= 12 ? "PM" : "AM";
      const displayHour = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
      const displayMin = currentMin.toString().padStart(2, "0");
      slots.push(`${displayHour}:${displayMin} ${period}`);

      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const fetchBookedSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const offset = date.getTimezoneOffset();
      const staffParam = booking.staff ? `&staffId=${booking.staff.id}` : "";
      const res = await fetch(
        `/api/bookings/check?demoId=${booking.demo.id}&date=${date.toISOString()}&offset=${offset}${staffParam}&serviceId=${booking.service.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedTimes || []);
      }
    } catch (err) {
      console.error("Failed to fetch booked slots:", err);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(new Date(selectedDate));
      setSelectedTime("");
    }
  }, [selectedDate]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [time, period] = selectedTime.split(" ");
      const [hrs, minutes] = time.split(":");
      let hour = parseInt(hrs);
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const newAppointmentTime = new Date(selectedDate);
      newAppointmentTime.setHours(hour, parseInt(minutes), 0, 0);

      const res = await fetch(`/api/bookings/manage/${booking.manageToken}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newAppointmentTime: newAppointmentTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reschedule");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const currentApptDate = new Date(booking.appointmentTime);
  const currentFormattedDate = currentApptDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const currentFormattedTime = currentApptDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (success) {
    const newDate = new Date(selectedDate);
    const [time, period] = selectedTime.split(" ");
    const [hrs, minutes] = time.split(":");
    let hour = parseInt(hrs);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    newDate.setHours(hour, parseInt(minutes), 0, 0);

    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Rescheduled!</h1>
        <p className="text-gray-400 mb-6">
          Your appointment has been moved to{" "}
          <span className="text-white font-medium">
            {newDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            at {selectedTime}
          </span>
        </p>
        <a
          href={`/manage/${booking.manageToken}`}
          className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          View Booking
        </a>
      </div>
    );
  }

  const availableDates = getAvailableDates();
  const timeSlots = selectedDate ? generateTimeSlots(new Date(selectedDate).getDay()) : [];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reschedule Appointment</h1>
        <p className="text-gray-400">{booking.demo.shopName}</p>
      </div>

      {/* Current Appointment */}
      <div className="glass-card rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-500 mb-1">Current Appointment</p>
        <p className="text-white font-medium">{booking.service.name}</p>
        <p className="text-gray-400">
          {currentFormattedDate} at {currentFormattedTime}
        </p>
        {booking.staff && (
          <p className="text-gray-500 text-sm">with {booking.staff.name}</p>
        )}
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select New Date
        </label>
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {availableDates.slice(0, 21).map(({ date, isBlocked }) => (
            <button
              key={date.toISOString()}
              onClick={() => !isBlocked && setSelectedDate(date.toISOString())}
              disabled={isBlocked}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedDate === date.toISOString()
                  ? "bg-purple-500 text-white"
                  : isBlocked
                  ? "bg-white/5 text-gray-600 cursor-not-allowed"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <div className="text-xs opacity-70">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="font-medium">
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select New Time
          </label>
          {loadingSlots ? (
            <div className="text-center py-4 text-gray-400">Loading times...</div>
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {timeSlots.map((time) => {
                const slotsNeeded = Math.ceil(booking.service.durationMinutes / 15);
                const timeIndex = timeSlots.indexOf(time);
                const slotsToCheck = timeSlots.slice(timeIndex, timeIndex + slotsNeeded);
                const hasEnoughSlots = slotsToCheck.length === slotsNeeded;
                const anySlotBooked = slotsToCheck.some((slot) => bookedSlots.includes(slot));
                const isUnavailable = !hasEnoughSlots || anySlotBooked;

                return (
                  <button
                    key={time}
                    onClick={() => !isUnavailable && setSelectedTime(time)}
                    disabled={isUnavailable}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedTime === time
                        ? "bg-purple-500 text-white"
                        : isUnavailable
                        ? "bg-white/5 text-gray-600 cursor-not-allowed line-through"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No available times</p>
          )}
        </div>
      )}

      {error && <div className="text-red-400 text-sm text-center mb-4">{error}</div>}

      <div className="flex gap-3">
        
          href={`/manage/${booking.manageToken}`}
          className="flex-1 py-3 px-4 border border-white/20 text-gray-400 text-center rounded-lg hover:bg-white/5"
        <a>
          Cancel
        </a>
        <button
          onClick={handleReschedule}
          disabled={!selectedDate || !selectedTime || loading}
          className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? "Rescheduling..." : "Confirm Reschedule"}
        </button>
      </div>
    </div>
  );
}