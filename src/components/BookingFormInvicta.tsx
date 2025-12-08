"use client";

import { useState } from "react";
import { downloadICSFile } from "@/lib/calendar";

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

interface StaffService {
  serviceId: string;
  service: { id: string; name: string };
}

interface Staff {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  hours: BusinessHours[];
  services: StaffService[];
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
  staff: Staff[];
}

export default function BookingFormInvicta({ demo, services, staff }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
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
      const staffParam = selectedStaff ? `&staffId=${selectedStaff.id}` : '';
      const serviceParam = selectedService ? `&serviceId=${selectedService.id}` : '';
      const res = await fetch(`/api/bookings/check?demoId=${demo.id}&date=${date.toISOString()}&offset=${offset}${staffParam}${serviceParam}`);
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

      currentMin += 15;
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

    for (let i = 0; i <= windowDays; i++) {
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
          staffId: selectedStaff?.id || null,
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
  const allTimeSlots = selectedDayOfWeek >= 0 ? generateTimeSlots(selectedDayOfWeek) : [];

  const timeSlots = allTimeSlots.filter((time) => {
    if (!selectedDate) return true;
    const selected = new Date(selectedDate);
    const now = new Date();
    if (selected.toDateString() !== now.toDateString()) return true;

    const [timePart, period] = time.split(" ");
    const [hrs, mins] = timePart.split(":").map(Number);
    let hour = hrs;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const slotTime = new Date(now);
    slotTime.setHours(hour, mins, 0, 0);
    return slotTime > now;
  });

  if (success) {
    const handleAddToCalendar = () => {
      const [time, period] = selectedTime.split(" ");
      const [hrs, minutes] = time.split(":");
      let hour = parseInt(hrs);
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hour, parseInt(minutes), 0, 0);

      downloadICSFile({
        title: `${selectedService?.name} at ${demo.shopName}`,
        description: `Appointment${selectedStaff ? ` with ${selectedStaff.name}` : ''}. Service: ${selectedService?.name} (${selectedService?.durationMinutes} min, $${selectedService?.price})`,
        location: demo.shopName,
        startTime: appointmentDate,
        durationMinutes: selectedService?.durationMinutes || 30,
      }, `${demo.shopName.replace(/\s+/g, '-')}-appointment.ics`);
    };

    return (
      <div className="invicta-card rounded-xl p-10 text-center">
        <div className="text-6xl mb-6">✓</div>
        <h2 className="font-bebas text-3xl tracking-wide text-[#F5F0E6] mb-4">
          {recurring !== "none" ? `${recurringCount} Appointments Booked!` : "Booking Confirmed!"}
        </h2>
        <p className="font-cormorant text-[#F5F0E6]/70 text-lg mb-2">
          Your {selectedService?.name}{selectedStaff ? ` with ${selectedStaff.name}` : ''} at {demo.shopName} {recurring !== "none" ? "starts" : "is booked for"}:
        </p>
        <p className="font-cinzel text-xl text-[#C9A227] mb-4">
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          at {selectedTime}
        </p>
        {recurring !== "none" && (
          <p className="font-cormorant text-[#F5F0E6]/70 mb-4">
            Repeating {recurring} for {recurringCount} appointments
          </p>
        )}
        <p className="text-[#8B7355] text-sm mb-6">
          Confirmation SMS has been sent to {customerInfo.phone}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAddToCalendar}
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-transparent border border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A0A0A] transition-all"
          >
            📅 Add to Calendar
          </button>
          <a
            href="/site/invicta-barbershop.html"
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-transparent border border-[#F5F0E6]/30 text-[#F5F0E6] hover:border-[#C9A227] hover:text-[#C9A227] transition-all text-center"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="invicta-card rounded-xl p-8">
      {/* Back to Home Link */}
      <div className="mb-6">
        <a
          href="/site/invicta-barbershop.html"
          className="font-cinzel text-xs tracking-widest uppercase text-[#8B7355] hover:text-[#C9A227] transition-colors"
        >
          ← Back to Home
        </a>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-cinzel text-sm ${
                step >= s
                  ? "bg-[#C9A227] text-[#0A0A0A]"
                  : "bg-[#141414] border border-[#C9A227]/20 text-[#8B7355]"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-px mx-2 ${
                  step > s ? "bg-[#C9A227]" : "bg-[#C9A227]/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="font-bebas text-3xl tracking-wide text-[#F5F0E6] mb-2 text-center">
            Select a Service
          </h2>
          <p className="font-cormorant text-[#F5F0E6]/70 text-center mb-8 italic">
            Choose your grooming experience
          </p>
          <div className="grid gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className={`p-5 rounded-lg border text-left transition-all ${
                  selectedService?.id === service.id
                    ? "border-[#C9A227] bg-[#C9A227]/10"
                    : "border-[#C9A227]/20 hover:border-[#C9A227]/50 bg-[#141414]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-cinzel text-lg text-[#F5F0E6] tracking-wide">
                      {service.name}
                    </h3>
                    <p className="font-cormorant text-[#8B7355] text-sm">
                      {service.durationMinutes} minutes
                    </p>
                  </div>
                  <div className="font-bebas text-2xl text-[#C9A227]">
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
          <h2 className="font-bebas text-3xl tracking-wide text-[#F5F0E6] mb-2 text-center">
            Pick a Date & Time
          </h2>
          <p className="font-cormorant text-[#F5F0E6]/70 text-center mb-8 italic">
            When would you like to visit?
          </p>

          {/* Staff Selection */}
          {staff.length > 0 && (
            <div className="mb-8">
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#C9A227] mb-3">
                Select Your Barber
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setSelectedStaff(null);
                    setSelectedDate("");
                    setSelectedTime("");
                  }}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    selectedStaff === null
                      ? "border-[#C9A227] bg-[#C9A227]/10"
                      : "border-[#C9A227]/20 hover:border-[#C9A227]/50 bg-[#141414]"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#141414] border border-[#C9A227]/30 flex items-center justify-center text-xl">
                    👥
                  </div>
                  <p className="font-cinzel text-[#F5F0E6] text-xs tracking-wide">Any Available</p>
                </button>
                {staff
                  .filter(s => s.services.some(ss => ss.serviceId === selectedService?.id))
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStaff(s);
                        setSelectedDate("");
                        setSelectedTime("");
                      }}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        selectedStaff?.id === s.id
                          ? "border-[#C9A227] bg-[#C9A227]/10"
                          : "border-[#C9A227]/20 hover:border-[#C9A227]/50 bg-[#141414]"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#141414] border border-[#C9A227]/30 flex items-center justify-center overflow-hidden">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-cinzel text-lg text-[#C9A227]">{s.name.charAt(0)}</span>
                        )}
                      </div>
                      <p className="font-cinzel text-[#F5F0E6] text-xs tracking-wide">{s.name}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

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
                      className="px-4 py-2 rounded-lg bg-[#141414] border border-[#C9A227]/20 text-[#F5F0E6] font-cormorant"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAllMonths(!showAllMonths)}
                      className="font-cormorant text-sm text-[#C9A227] hover:text-[#D4AF37]"
                    >
                      {showAllMonths ? "Show less" : `Show all ${months.length} months`}
                    </button>
                  </div>

                  {displayMonths.map((month) => (
                    <div key={month}>
                      {showAllMonths && (
                        <h3 className="font-cinzel text-[#F5F0E6] text-sm tracking-wide mb-3">{month}</h3>
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
                            className={`p-3 rounded-lg text-center transition-all ${
                              selectedDate && new Date(selectedDate).toDateString() === item.date.toDateString()
                                ? "bg-[#C9A227] text-[#0A0A0A]"
                                : item.isBlocked
                                  ? "bg-[#141414] text-[#8B7355]/50 cursor-not-allowed border border-[#C9A227]/10"
                                  : "bg-[#141414] text-[#F5F0E6] hover:border-[#C9A227]/50 border border-[#C9A227]/20"
                            }`}
                            title={item.isBlocked ? (item.reason || "Closed") : ""}
                          >
                            <div className={`font-cormorant text-xs ${item.isBlocked ? "text-[#8B7355]/50" : selectedDate && new Date(selectedDate).toDateString() === item.date.toDateString() ? "text-[#0A0A0A]" : "text-[#8B7355]"}`}>
                              {item.date.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                            <div className={`font-bebas text-lg ${item.isBlocked ? "line-through" : ""}`}>{item.date.getDate()}</div>
                            {item.isBlocked && (
                              <div className="text-[10px] text-red-400/70 truncate">{item.reason || "Closed"}</div>
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
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#C9A227] mb-3">
                Select Time
              </label>
              {loadingSlots ? (
                <p className="font-cormorant text-[#F5F0E6]/70 text-center py-4 italic">Loading available times...</p>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {timeSlots.map((time, index) => {
                    const slotsNeeded = Math.ceil((selectedService?.durationMinutes || 30) / 15);
                    const slotsToCheck = timeSlots.slice(index, index + slotsNeeded);
                    const hasEnoughSlots = slotsToCheck.length === slotsNeeded;
                    const anySlotBooked = slotsToCheck.some(slot => bookedSlots.includes(slot));
                    const isUnavailable = !hasEnoughSlots || anySlotBooked;
                    return (
                      <button
                        key={time}
                        onClick={() => !isUnavailable && setSelectedTime(time)}
                        disabled={isUnavailable}
                        className={`p-3 rounded-lg text-center transition-all font-cormorant ${
                          selectedTime === time
                            ? "bg-[#C9A227] text-[#0A0A0A]"
                            : isUnavailable
                              ? "bg-[#141414] text-[#8B7355]/50 cursor-not-allowed line-through border border-[#C9A227]/10"
                              : "bg-[#141414] text-[#F5F0E6] hover:border-[#C9A227]/50 border border-[#C9A227]/20"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="font-cormorant text-[#F5F0E6]/70 text-center py-4 italic">No available times for this date</p>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mb-8">
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#C9A227] mb-3">
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
                    className={`p-3 rounded-lg text-center transition-all font-cinzel text-xs tracking-wide ${
                      recurring === option.value
                        ? "bg-[#C9A227] text-[#0A0A0A]"
                        : "bg-[#141414] text-[#F5F0E6] hover:border-[#C9A227]/50 border border-[#C9A227]/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {recurring !== "none" && (
                <div className="mt-4">
                  <label className="block font-cinzel text-xs tracking-widest uppercase text-[#8B7355] mb-2">
                    Number of appointments
                  </label>
                  <div className="flex gap-3">
                    {[4, 8, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setRecurringCount(num)}
                        className={`px-6 py-2 rounded-lg transition-all font-bebas text-lg ${
                          recurringCount === num
                            ? "bg-[#C9A227] text-[#0A0A0A]"
                            : "bg-[#141414] text-[#F5F0E6] hover:border-[#C9A227]/50 border border-[#C9A227]/20"
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
              className="flex-1 py-3 rounded-lg border border-[#F5F0E6]/30 text-[#F5F0E6] hover:border-[#C9A227] hover:text-[#C9A227] transition-all font-cinzel text-xs tracking-widest uppercase"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 py-3 rounded-lg bg-[#C9A227] text-[#0A0A0A] font-cinzel text-xs tracking-widest uppercase disabled:opacity-50 hover:bg-[#D4AF37] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Info */}
      {step === 3 && (
        <div>
          <h2 className="font-bebas text-3xl tracking-wide text-[#F5F0E6] mb-2 text-center">
            Your Information
          </h2>
          <p className="font-cormorant text-[#F5F0E6]/70 text-center mb-8 italic">
            Almost there! Just a few details
          </p>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#C9A227] mb-2">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-[#141414] border border-[#C9A227]/20 text-[#F5F0E6] placeholder-[#8B7355] focus:outline-none focus:border-[#C9A227] font-cormorant text-lg"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#C9A227] mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, phone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-[#141414] border border-[#C9A227]/20 text-[#F5F0E6] placeholder-[#8B7355] focus:outline-none focus:border-[#C9A227] font-cormorant text-lg"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block font-cinzel text-xs tracking-widest uppercase text-[#8B7355] mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-[#141414] border border-[#C9A227]/20 text-[#F5F0E6] placeholder-[#8B7355] focus:outline-none focus:border-[#C9A227] font-cormorant text-lg"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-[#141414] border border-[#C9A227]/20 rounded-xl p-5 mb-8">
            <h3 className="font-cinzel text-xs tracking-widest uppercase text-[#8B7355] mb-3">
              Booking Summary
            </h3>
            <div className="space-y-2 font-cormorant text-lg">
              <div className="flex justify-between text-[#F5F0E6]">
                <span>Service:</span>
                <span className="text-[#C9A227]">{selectedService?.name}</span>
              </div>
              {selectedStaff && (
                <div className="flex justify-between text-[#F5F0E6]">
                  <span>Barber:</span>
                  <span className="text-[#C9A227]">{selectedStaff.name}</span>
                </div>
              )}
              <div className="flex justify-between text-[#F5F0E6]">
                <span>Date:</span>
                <span className="text-[#C9A227]">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-[#F5F0E6]">
                <span>Time:</span>
                <span className="text-[#C9A227]">{selectedTime}</span>
              </div>
              {recurring !== "none" && (
                <div className="flex justify-between text-[#F5F0E6]">
                  <span>Repeat:</span>
                  <span className="text-[#C9A227] capitalize">{recurring} × {recurringCount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#C9A227]/20 pt-2 mt-2">
                <span className="text-[#F5F0E6]">Price:</span>
                <span className="font-bebas text-xl text-[#C9A227]">
                  ${selectedService?.price}{recurring !== "none" ? ` × ${recurringCount} = $${(selectedService?.price || 0) * recurringCount}` : ""}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mb-4 font-cormorant">{error}</div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-lg border border-[#F5F0E6]/30 text-[#F5F0E6] hover:border-[#C9A227] hover:text-[#C9A227] transition-all font-cinzel text-xs tracking-widest uppercase"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-[#C9A227] text-[#0A0A0A] font-cinzel text-xs tracking-widest uppercase disabled:opacity-50 hover:bg-[#D4AF37] transition-all"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}