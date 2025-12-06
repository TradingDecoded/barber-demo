"use client";

import { useState, useEffect, useCallback } from "react";
import AdminStaff from "./AdminStaff";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  appointmentTime: string;
  status: string;
  reminderSent: boolean;
  reviewSent: boolean;
  createdAt: string;
  service: Service;
}

interface BusinessHours {
  id: string;
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

interface StaffHours {
  id: string;
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface StaffServiceItem {
  id: string;
  serviceId: string;
  service: { id: string; name: string };
}

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  isActive: boolean;
  sortOrder: number;
  hours: StaffHours[];
  services: StaffServiceItem[];
}

interface Demo {
  id: string;
  slug: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  logoUrl: string | null;
  accentColor: string;
  bookingWindowDays: number;
  createdAt: string;
  services: Service[];
  bookings: Booking[];
  hours: BusinessHours[];
  blockedDates: BlockedDate[];
  staff: Staff[];
}

interface Props {
  demo: Demo;
}

export default function AdminDashboard({ demo }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [services, setServices] = useState(demo.services);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(demo.logoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(demo.bookings);
  const [staff, setStaff] = useState<Staff[]>(demo.staff);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newAppointmentTime, setNewAppointmentTime] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState("upcoming");
  const [bookingWindowDays, setBookingWindowDays] = useState(demo.bookingWindowDays || 60);
  const [savingWindow, setSavingWindow] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(demo.blockedDates || []);
  const [newBlockedStartDate, setNewBlockedStartDate] = useState("");
  const [newBlockedEndDate, setNewBlockedEndDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [savingBlocked, setSavingBlocked] = useState(false);
  const defaultHours = [
    { day: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" },
    { day: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" },
  ];
  const [hours, setHours] = useState(
    demo.hours.length > 0
      ? demo.hours.sort((a, b) => a.day - b.day)
      : defaultHours
  );

  const [newService, setNewService] = useState({ name: "", durationMinutes: "30", price: "" });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const bookingUrl = baseUrl + "/demo/" + demo.slug;
  const now = new Date();

  // Poll for new bookings every 15 seconds
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings?demoId=${demo.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  }, [demo.id]);

  useEffect(() => {
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upcomingBookings = bookings.filter((b) => {
    return new Date(b.appointmentTime) >= now && b.status === "confirmed";
  });

  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.appointmentTime);
    return d.toDateString() === now.toDateString() && b.status === "confirmed";
  });

  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.service.price, 0);

  const fmt = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price) return;
    setSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, ...newService }),
      });
      if (res.ok) {
        const service = await res.json();
        setServices([...services, service]);
        setNewService({ name: "", durationMinutes: "30", price: "" });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      const res = await fetch("/api/services/" + editingService.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });
      if (res.ok) {
        const updated = await res.json();
        setServices(services.map((s) => (s.id === updated.id ? updated : s)));
        setEditingService(null);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      const res = await fetch("/api/services/" + id, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("demoId", demo.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl + "?t=" + Date.now());
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const updateHours = (day: number, field: string, value: string | boolean) => {
    setHours(hours.map((h) => (h.day === day ? { ...h, [field]: value } : h)));
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const res = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, hours }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSavingHours(false);
  };

  const handleSaveBookingWindow = async () => {
    setSavingWindow(true);
    try {
      const res = await fetch("/api/demos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, bookingWindowDays }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSavingWindow(false);
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedStartDate) return;
    setSavingBlocked(true);
    try {
      const startDate = new Date(newBlockedStartDate);
      const endDate = newBlockedEndDate ? new Date(newBlockedEndDate) : startDate;

      const datesToBlock: Date[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        datesToBlock.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      const newBlocked: BlockedDate[] = [];
      for (const date of datesToBlock) {
        const res = await fetch("/api/blocked-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            demoId: demo.id,
            date: date.toISOString(),
            reason: newBlockedReason || null,
          }),
        });
        if (res.ok) {
          const blocked = await res.json();
          newBlocked.push(blocked);
        }
      }

      setBlockedDates([...blockedDates, ...newBlocked].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewBlockedStartDate("");
      setNewBlockedEndDate("");
      setNewBlockedReason("");
    } catch (e) {
      console.error(e);
    }
    setSavingBlocked(false);
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      const res = await fetch(`/api/blocked-dates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlockedDates(blockedDates.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this appointment? The customer will be notified.")) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)));
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newAppointmentTime) return;
    setActionLoading(rescheduleBooking.id);
    try {
      const res = await fetch(`/api/bookings/${rescheduleBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", newTime: newAppointmentTime }),
      });
      if (res.ok) {
        setBookings(bookings.map((b) =>
          b.id === rescheduleBooking.id ? { ...b, appointmentTime: newAppointmentTime } : b
        ));
        setRescheduleBooking(null);
        setNewAppointmentTime("");
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={demo.shopName} className="h-10 max-w-[120px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {demo.shopName.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-xl font-semibold text-white">{demo.shopName}</span>
              <span className="text-gray-500 text-sm block">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={"/tv/" + demo.slug} target="_blank" className="text-sm text-gray-400 hover:text-white">
              TV Display
            </a>
            <a href={"/demo/" + demo.slug} target="_blank" className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 flex items-center gap-2">
              👁️ Preview Booking Page
            </a>
          </div>
        </div>
      </header>

      <div className="bg-purple-500/10 border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white font-medium">Share your booking link</p>
              <p className="text-gray-400 text-sm">Send this to customers so they can book</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="text" readOnly value={bookingUrl} className="flex-1 sm:w-80 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
              <button onClick={copyLink} className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          <button onClick={() => setActiveTab("overview")} className={activeTab === "overview" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Overview</button>
          <button onClick={() => setActiveTab("bookings")} className={activeTab === "bookings" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Bookings</button>
          <button onClick={() => setActiveTab("services")} className={activeTab === "services" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Services</button>
          <button onClick={() => setActiveTab("closures")} className={activeTab === "closures" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Closures</button>
          <button onClick={() => setActiveTab("staff")} className={activeTab === "staff" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Staff</button>
          <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "py-4 text-sm font-medium border-b-2 border-purple-500 text-white" : "py-4 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white"}>Settings</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-5">
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-white mt-1">{bookings.length}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-gray-400 text-sm">Today</p>
                <p className="text-3xl font-bold text-white mt-1">{todayBookings.length}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-gray-400 text-sm">Upcoming</p>
                <p className="text-3xl font-bold text-white mt-1">{upcomingBookings.length}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-gray-400 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">${totalRevenue}</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Todays Schedule</h2>
              {todayBookings.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-gray-400">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((b) => (
                    <div key={b.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-purple-400">{fmt(b.appointmentTime).time}</div>
                        <div>
                          <p className="text-white font-medium">{b.customerName}</p>
                          <p className="text-gray-400 text-sm">{b.service.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${b.service.price}</p>
                        <p className="text-gray-500 text-sm">{b.customerPhone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Upcoming Appointments</h2>
              {upcomingBookings.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-gray-400">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-purple-400 font-medium">{fmt(b.appointmentTime).date}</p>
                          <p className="text-white text-lg font-bold">{fmt(b.appointmentTime).time}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{b.customerName}</p>
                          <p className="text-gray-400 text-sm">{b.service.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${b.service.price}</p>
                        <p className="text-gray-500 text-sm">{b.customerPhone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Bookings</h2>
              <div className="flex gap-2">
                {["all", "today", "upcoming", "completed", "cancelled"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setBookingFilter(filter)}
                    className={bookingFilter === filter
                      ? "px-3 py-1 rounded-lg bg-purple-500 text-white text-sm font-medium"
                      : "px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-sm hover:bg-white/20"
                    }
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-gray-400">No bookings yet. Share your link to get started!</p>
              </div>
            ) : (
              <div className="glass-card rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Customer</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Service</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Date/Time</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Status</th>
                      <th className="text-right text-gray-400 text-sm font-medium px-5 py-3">Price</th>
                      <th className="text-right text-gray-400 text-sm font-medium px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.filter((b) => {
                      const isPast = new Date(b.appointmentTime) < now;
                      const isToday = new Date(b.appointmentTime).toDateString() === now.toDateString();
                      const isCancelled = b.status === "cancelled";

                      if (bookingFilter === "today") return isToday && !isCancelled;
                      if (bookingFilter === "upcoming") return !isPast && !isCancelled;
                      if (bookingFilter === "completed") return isPast && !isCancelled;
                      if (bookingFilter === "cancelled") return isCancelled;
                      return true;
                    }).map((b) => {
                      const isPast = new Date(b.appointmentTime) < now;
                      const isCancelled = b.status === "cancelled";
                      return (
                        <tr key={b.id} className={isPast || isCancelled ? "opacity-50" : ""}>
                          <td className="px-5 py-4">
                            <p className="text-white font-medium">{b.customerName}</p>
                            <p className="text-gray-500 text-sm">{b.customerPhone}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-white">{b.service.name}</p>
                            <p className="text-gray-500 text-sm">{b.service.durationMinutes} min</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-white">{fmt(b.appointmentTime).date}</p>
                            <p className="text-gray-500 text-sm">{fmt(b.appointmentTime).time}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={
                              isCancelled ? "inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400" :
                                isPast ? "inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400" :
                                  "inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400"
                            }>
                              {isCancelled ? "Cancelled" : isPast ? "Completed" : b.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-white font-medium">${b.service.price}</p>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            {!isPast && !isCancelled && (
                              <>
                                <button
                                  onClick={() => {
                                    setRescheduleBooking(b);
                                    const dt = new Date(b.appointmentTime);
                                    setNewAppointmentTime(dt.toISOString().slice(0, 16));
                                  }}
                                  disabled={actionLoading === b.id}
                                  className="text-purple-400 hover:text-purple-300 text-sm"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  disabled={actionLoading === b.id}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  {actionLoading === b.id ? "..." : "Cancel"}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {rescheduleBooking && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
                  <h3 className="text-white font-semibold text-lg">Reschedule Appointment</h3>
                  <p className="text-gray-400">
                    {rescheduleBooking.customerName} - {rescheduleBooking.service.name}
                  </p>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">New Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newAppointmentTime}
                      onChange={(e) => setNewAppointmentTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReschedule}
                      disabled={actionLoading === rescheduleBooking.id}
                      className="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                    >
                      {actionLoading === rescheduleBooking.id ? "Saving..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => { setRescheduleBooking(null); setNewAppointmentTime(""); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Manage Services</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600"
              >
                + Add Service
              </button>
            </div>

            {showAddForm && (
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-white font-medium">New Service</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                      placeholder="Haircut"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      value={newService.durationMinutes}
                      onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                      placeholder="35"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddService}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Service"}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Service</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Duration</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Price</th>
                    <th className="text-right text-gray-400 text-sm font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {services.map((s) => (
                    <tr key={s.id}>
                      {editingService?.id === s.id ? (
                        <>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={editingService.name}
                              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                              className="w-full px-3 py-1 rounded bg-white/10 border border-white/20 text-white"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              value={editingService.durationMinutes}
                              onChange={(e) => setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value) })}
                              className="w-20 px-3 py-1 rounded bg-white/10 border border-white/20 text-white"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              value={editingService.price}
                              onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) })}
                              className="w-20 px-3 py-1 rounded bg-white/10 border border-white/20 text-white"
                            />
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button onClick={handleUpdateService} disabled={saving} className="text-green-400 hover:text-green-300 text-sm">Save</button>
                            <button onClick={() => setEditingService(null)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-white">{s.name}</td>
                          <td className="px-5 py-4 text-gray-400">{s.durationMinutes} min</td>
                          <td className="px-5 py-4 text-purple-400 font-medium">${s.price}</td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button onClick={() => setEditingService(s)} className="text-purple-400 hover:text-purple-300 text-sm">Edit</button>
                            <button onClick={() => handleDeleteService(s.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "closures" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Blocked Dates</h2>
            <p className="text-gray-400">Block off dates for vacations, holidays, or other closures. Customers won&apos;t be able to book on these dates.</p>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium">Add Blocked Dates</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBlockedStartDate}
                    onChange={(e) => {
                      setNewBlockedStartDate(e.target.value);
                      if (newBlockedEndDate && e.target.value > newBlockedEndDate) {
                        setNewBlockedEndDate(e.target.value);
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBlockedEndDate}
                    onChange={(e) => setNewBlockedEndDate(e.target.value)}
                    min={newBlockedStartDate || new Date().toISOString().split("T")[0]}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-gray-400 text-sm mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                    placeholder="e.g., Vacation, Holiday"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={handleAddBlockedDate}
                  disabled={!newBlockedStartDate || savingBlocked}
                  className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                >
                  {savingBlocked ? "Adding..." : "Block Dates"}
                </button>
              </div>
              {newBlockedStartDate && newBlockedEndDate && newBlockedStartDate !== newBlockedEndDate && (
                <p className="text-gray-400 text-sm">
                  This will block {Math.ceil((new Date(newBlockedEndDate).getTime() - new Date(newBlockedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              )}
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Date</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-5 py-3">Reason</th>
                    <th className="text-right text-gray-400 text-sm font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {blockedDates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-gray-400">No blocked dates</td>
                    </tr>
                  ) : (
                    blockedDates.map((b) => (
                      <tr key={b.id}>
                        <td className="px-5 py-4 text-white">
                          {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-gray-400">{b.reason || "—"}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleDeleteBlockedDate(b.id)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <AdminStaff
            slug={demo.slug}
            initialStaff={staff}
            services={services}
            accentColor={demo.accentColor || "#8b5cf6"}
            onStaffChange={setStaff}
          />
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Demo Settings</h2>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium">Shop Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-6">
                  <div className="relative">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Shop logo" className="h-20 max-w-[160px] object-contain" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {demo.shopName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Shop Logo</p>
                    <label className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 cursor-pointer">
                      {uploading ? "Uploading..." : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
                <div><p className="text-gray-400 text-sm">Shop Name</p><p className="text-white">{demo.shopName}</p></div>
                <div><p className="text-gray-400 text-sm">Owner</p><p className="text-white">{demo.ownerName}</p></div>
                <div><p className="text-gray-400 text-sm">Email</p><p className="text-white">{demo.email}</p></div>
                <div><p className="text-gray-400 text-sm">Phone</p><p className="text-white">{demo.phone}</p></div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium">Business Hours</h3>

              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.day} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                    <div className="w-24">
                      <span className="text-white">{dayNames[h.day]}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={h.isOpen}
                        onChange={(e) => updateHours(h.day, "isOpen", e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-400 text-sm">{h.isOpen ? "Open" : "Closed"}</span>
                    </label>
                    {h.isOpen && (
                      <>
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={(e) => updateHours(h.day, "openTime", e.target.value)}
                          className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={(e) => updateHours(h.day, "closeTime", e.target.value)}
                          className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveHours}
                disabled={savingHours}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                {savingHours ? "Saving..." : "Save Hours"}
              </button>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium">Booking Window</h3>
              <p className="text-gray-400 text-sm">How far in advance can customers book?</p>
              <div className="flex items-center gap-4">
                <select
                  value={bookingWindowDays}
                  onChange={(e) => setBookingWindowDays(Number(e.target.value))}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                </select>
                <button
                  onClick={handleSaveBookingWindow}
                  disabled={savingWindow}
                  className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                >
                  {savingWindow ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium">Demo Code</h3>
              <p className="text-gray-400 text-sm">Share this code with customers</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-purple-400 font-mono">{demo.slug}</code>
                <button onClick={copyLink} className="px-4 py-3 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600">{copied ? "Copied!" : "Copy Link"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
