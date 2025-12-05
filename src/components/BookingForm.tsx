"use client";

import { useState } from "react";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface BusinessHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Demo {
  id: string;
  slug: string;
  shopName: string;
  ownerName: string;
  phone: string;
  hours: BusinessHours[];
  bookingWindowDays?: number;
  blockedDates?: { date: string; reason: string | null }[];
}

interface BookingFormProps {
  demo: Demo;
  services: Service[];
}

export default function BookingForm({ demo, services }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [recurring, setRecurring] = useState("none");
  const [recurringCount, setRecurringCount] = useState(4);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const defaultHours: BusinessHours[] = [
    { day: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" },
    { day: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" },
  ];

  const hours = demo.hours.length > 0 ? demo.hours : defaultHours;

  const getHoursForDay = (dayOfWeek: number): BusinessHours | undefined => {
    return hours.find((h) => h.day === dayOfWeek);
  };

  const fetchBookedSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const offset = date.getTimezoneOffset();
      const res = await fetch(`/api/bookings/check?demoId=${demo.id}&date=${date.toISOString()}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedTimes || []);
      }
    } catch (err) {
      console.error("Failed to fetch booked slots:", err);
    }
    setLoadingSlots(false);
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

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const getBlockedDateInfo = (date: Date): { isBlocked: boolean; reason: string | null } => {
    const blocked = (demo.blockedDates || []).find(
      (b) => new Date(b.date).toDateString() === date.toDateString()
    );
    return { isBlocked: !!blocked, reason: blocked?.reason || null };
  };

  const getAvailableDates = () => {
    const dates: { date: Date; isBlocked: boolean; reason: string | null }[] = [];
    const today = new Date();
    const windowDays = demo.bookingWindowDays || 60;

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

  const groupDatesByMonth = () => {
    const dates = getAvailableDates();
    const grouped: { [key: string]: { date: Date; isBlocked: boolean; reason: string | null }[] } = {};

    dates.forEach((item) => {
      const monthKey = item.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(item);
    });

    return grouped;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showAllMonths, setShowAllMonths] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !customerInfo.name || !customerInfo.phone) {
      setError("Please fill in all required fields");
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

      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hour, parseInt(minutes), 0, 0);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoId: demo.id,
          serviceId: selectedService.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          appointmentTime: appointmentDate.toISOString(),
          recurring: recurring,
          recurringCount: recurring !== "none" ? recurringCount : 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectedDayOfWeek = selectedDate ? new Date(selectedDate).getDay() : -1;
  const timeSlots = selectedDayOfWeek >= 0 ? generateTimeSlots(selectedDayOfWeek) : [];

  if (success) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          {recurring !== "none" ? `${recurringCount} Appointments Booked!` : "Booking Confirmed!"}
        </h2>
        <p className="text-gray-400 mb-2">
          Your {selectedService?.name} at {demo.shopName} {recurring !== "none" ? "starts" : "is booked for"}:
        </p>
        <p className="text-xl text-purple-400 font-semibold mb-4">
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          at {selectedTime}
        </p>
        {recurring !== "none" && (
          <p className="text-gray-400 mb-4">
            Repeating {recurring} for {recurringCount} appointments
          </p>
        )}
        <p className="text-gray-500 text-sm">
          Confirmation SMS has been sent to {customerInfo.phone}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-gray-500"
                }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${step > s ? "bg-purple-500" : "bg-white/10"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Select a Service
          </h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className={`p-5 rounded-xl border text-left transition-all ${selectedService?.id === service.id
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-white/10 hover:border-white/30"
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {service.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {service.durationMinutes} minutes
                    </p>
                  </div>
                  <div className="text-xl font-bold text-purple-400">
                    ${service.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Pick a Date & Time
          </h2>

          <div className="mb-8">

            {(() => {
              const grouped = groupDatesByMonth();
              const months = Object.keys(grouped);
              const currentMonth = selectedMonth || months[0];
              const displayMonths = showAllMonths ? months : [currentMonth];

              return (
                <div className="space-y-6">
                  {/* Month selector */}
                  <div className="flex items-center gap-3">
                    <select
                      value={currentMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAllMonths(!showAllMonths)}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      {showAllMonths ? "Show less" : `Show all ${months.length} months`}
                    </button>
                  </div>

                  {displayMonths.map((month) => (
                    <div key={month}>
                      {showAllMonths && (
                        <h3 className="text-white font-medium mb-3">{month}</h3>
                      )}
                      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                        {grouped[month].map((item) => (
                          <button
                            key={item.date.toISOString()}
                            onClick={() => {
                              if (!item.isBlocked) {
                                setSelectedDate(item.date.toISOString());
                                setSelectedTime("");
                                fetchBookedSlots(item.date);
                              }
                            }}
                            disabled={item.isBlocked}
                            className={`p-3 rounded-lg text-center transition-all ${selectedDate && new Date(selectedDate).toDateString() === item.date.toDateString()
                              ? "bg-purple-500 text-white"
                              : item.isBlocked
                                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                              }`}
                            title={item.isBlocked ? (item.reason || "Closed") : ""}
                          >
                            <div className={`text-xs ${item.isBlocked ? "text-gray-600" : "text-gray-400"}`}>
                              {item.date.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                            <div className={`font-semibold ${item.isBlocked ? "line-through" : ""}`}>{item.date.getDate()}</div>
                            {item.isBlocked && (
                              <div className="text-[10px] text-red-400 truncate">{item.reason || "Closed"}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          {selectedDate && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Time
              </label>
              {loadingSlots ? (
                <p className="text-gray-400 text-center py-4">Loading available times...</p>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className={`p-3 rounded-lg text-center transition-all ${selectedTime === time
                          ? "bg-purple-500 text-white"
                          : isBooked
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
                <p className="text-gray-400 text-center py-4">No available times for this date</p>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Repeat Appointment?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "none", label: "One-time" },
                  { value: "weekly", label: "Weekly" },
                  { value: "biweekly", label: "Bi-weekly" },
                  { value: "monthly", label: "Monthly" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRecurring(option.value)}
                    className={`p-3 rounded-lg text-center transition-all ${recurring === option.value
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {recurring !== "none" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of appointments
                  </label>
                  <div className="flex gap-3">
                    {[4, 8, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setRecurringCount(num)}
                        className={`px-6 py-2 rounded-lg transition-all ${recurringCount === num
                          ? "bg-purple-500 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 py-3 rounded-lg bg-purple-500 text-white font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Info */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Your Information
          </h2>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, phone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white/5 rounded-xl p-5 mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Booking Summary
            </h3>
            <div className="space-y-2 text-white">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-semibold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-semibold">{selectedTime}</span>
              </div>
              {recurring !== "none" && (
                <div className="flex justify-between">
                  <span>Repeat:</span>
                  <span className="font-semibold capitalize">{recurring} × {recurringCount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span>Price:</span>
                <span className="font-bold text-purple-400">
                  ${selectedService?.price}{recurring !== "none" ? ` × ${recurringCount} = $${(selectedService?.price || 0) * recurringCount}` : ""}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mb-4">{error}</div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}