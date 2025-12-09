"use client";

import { useState, useEffect, useCallback } from "react";
import AdminStaff from "./AdminStaff";
import GuidedTourInvicta from "./GuidedTourInvicta";
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
  wasAutoAssigned: boolean;
  createdAt: string;
  service: Service;
  staff: { id: string; name: string } | null;
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

interface GalleryImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
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
  tagline: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  aboutTitle: string | null;
  aboutText1: string | null;
  aboutText2: string | null;
  aboutSignature: string | null;
  aboutImageUrl: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  galleryImages: GalleryImage[];
  tourCompleted: boolean;
}

interface Props {
  demo: Demo;
}

export default function AdminDashboardInvicta({ demo }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTour, setShowTour] = useState(!demo.tourCompleted);
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
  const [staffFilter, setStaffFilter] = useState("all");
  const [bookingWindowDays, setBookingWindowDays] = useState(demo.bookingWindowDays || 60);
  const [savingWindow, setSavingWindow] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(demo.blockedDates || []);
  const [newBlockedStartDate, setNewBlockedStartDate] = useState("");
  const [newBlockedEndDate, setNewBlockedEndDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  const handleReassignStaff = async (bookingId: string, newStaffId: string | null) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: newStaffId, wasAutoAssigned: false }),
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to reassign staff:', error);
    }
  };

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
    const apptDate = new Date(b.appointmentTime);
    const isAfterToday = apptDate.toDateString() !== now.toDateString() && apptDate > now;
    return isAfterToday && b.status === "confirmed";
  });

  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.appointmentTime);
    return d.toDateString() === now.toDateString() && b.status !== "cancelled";
  });

  const totalRevenue = bookings
    .filter((b) => {
      const isPast = new Date(b.appointmentTime) < now;
      return b.status === "completed" || (b.status === "confirmed" && isPast);
    })
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

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/demos/${demo.slug}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to reset demo");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reset demo");
    }
    setResetting(false);
    setShowResetConfirm(false);
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

  // Invicta theme colors
  const gold = "#C9A227";
  const goldLight = "#D4AF37";
  const goldDark = "#8B7355";
  const black = "#0A0A0A";
  const blackLight = "#141414";
  const cream = "#F5F0E6";

  return (
  <>
    {showTour && (
      <GuidedTourInvicta
        slug={demo.slug}
        demoId={demo.id}
        onComplete={() => setShowTour(false)}
        setActiveTab={setActiveTab}
      />
    )}
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#C9A227]/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={demo.shopName} className="h-10 max-w-[120px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center text-[#0A0A0A] font-cinzel font-bold">
                {demo.shopName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-cinzel text-xl font-semibold text-[#F5F0E6]">{demo.shopName}</span>
              <span className="font-cormorant text-[#8B7355] text-sm block">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={"/tv/" + demo.slug} target="_blank" className="font-cinzel text-xs tracking-wider text-[#8B7355] hover:text-[#C9A227] transition-colors">
              TV Display
            </a>
            <a href={"/site/" + demo.slug + ".html"} target="_blank" data-tour="view-website" className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] transition-colors flex items-center gap-2">
              🌐 View Website
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-[#C9A227]/20">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {["overview", "bookings", "services", "availability", "staff", "settings"].map((tab) => (
            <button
              key={tab}
              data-tour={`${tab}-tab`}
              onClick={() => setActiveTab(tab)}
              className={`font-cinzel text-xs tracking-wider px-4 py-3 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "text-[#C9A227] border-b-2 border-[#C9A227]"
                  : "text-[#8B7355] hover:text-[#F5F0E6]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="invicta-card rounded-xl p-5">
                <p className="font-cormorant text-[#8B7355] text-sm">Total Bookings</p>
                <p className="font-bebas text-4xl text-[#F5F0E6] mt-1">{bookings.length}</p>
              </div>
              <div className="invicta-card rounded-xl p-5">
                <p className="font-cormorant text-[#8B7355] text-sm">Today</p>
                <p className="font-bebas text-4xl text-[#F5F0E6] mt-1">{todayBookings.length}</p>
              </div>
              <div className="invicta-card rounded-xl p-5">
                <p className="font-cormorant text-[#8B7355] text-sm">Upcoming</p>
                <p className="font-bebas text-4xl text-[#F5F0E6] mt-1">{upcomingBookings.length}</p>
              </div>
              <div className="invicta-card rounded-xl p-5">
                <p className="font-cormorant text-[#8B7355] text-sm">Revenue</p>
                <p className="font-bebas text-4xl text-[#C9A227] mt-1">${totalRevenue}</p>
              </div>
            </div>

            {/* Today's Schedule */}
            <div>
              <h2 className="font-cinzel text-xl text-[#F5F0E6] mb-4">Today&apos;s Schedule</h2>
              {todayBookings.length === 0 ? (
                <div className="invicta-card rounded-xl p-8 text-center">
                  <p className="font-cormorant text-[#8B7355]">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((b) => {
                    const isPast = new Date(b.appointmentTime) < now;
                    const isCompleted = b.status === "completed" || (b.status === "confirmed" && isPast);
                    const isNoShow = b.status === "noshow";
                    return (
                      <div key={b.id} className={`invicta-card rounded-xl p-5 flex items-center justify-between ${isCompleted || isNoShow ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-4">
                          <div className={`font-bebas text-2xl ${isNoShow ? "text-orange-400" : isCompleted ? "text-[#8B7355]" : "text-[#C9A227]"}`}>
                            {fmt(b.appointmentTime).time}
                          </div>
                          <div>
                            <p className="font-cinzel text-[#F5F0E6]">{b.customerName}</p>
                            <p className="font-cormorant text-[#8B7355] text-sm">{b.service.name} {b.staff ? `• ${b.staff.name}` : ""}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          {isNoShow && <span className="px-2 py-1 rounded-full text-xs font-cinzel bg-orange-500/20 text-orange-400">No Show</span>}
                          {isCompleted && !isNoShow && <span className="px-2 py-1 rounded-full text-xs font-cinzel bg-[#8B7355]/20 text-[#8B7355]">Completed</span>}
                          <div>
                            <p className="font-cinzel text-[#C9A227]">${b.service.price}</p>
                            <p className="font-cormorant text-[#8B7355] text-sm">{b.customerPhone}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div>
              <h2 className="font-cinzel text-xl text-[#F5F0E6] mb-4">Upcoming Appointments</h2>
              {upcomingBookings.length === 0 ? (
                <div className="invicta-card rounded-xl p-8 text-center">
                  <p className="font-cormorant text-[#8B7355]">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="invicta-card rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-cormorant text-[#C9A227]">{fmt(b.appointmentTime).date}</p>
                          <p className="font-bebas text-xl text-[#F5F0E6]">{fmt(b.appointmentTime).time}</p>
                        </div>
                        <div>
                          <p className="font-cinzel text-[#F5F0E6]">{b.customerName}</p>
                          <p className="font-cormorant text-[#8B7355] text-sm">{b.service.name} {b.staff ? `• ${b.staff.name}` : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-cinzel text-[#C9A227]">${b.service.price}</p>
                        <p className="font-cormorant text-[#8B7355] text-sm">{b.customerPhone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="font-cinzel text-xl text-[#F5F0E6]">Bookings</h2>
                <div className="flex gap-2 flex-wrap">
                  {["all", "today", "upcoming", "completed", "noshow", "cancelled"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBookingFilter(filter)}
                      className={`font-cinzel text-xs tracking-wider px-3 py-1.5 transition-colors ${
                        bookingFilter === filter
                          ? "bg-[#C9A227] text-[#0A0A0A]"
                          : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                      }`}
                    >
                      {filter === "noshow" ? "No Show" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-cormorant text-[#8B7355] text-sm">Staff:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStaffFilter("all")}
                    className={`font-cinzel text-xs tracking-wider px-3 py-1.5 transition-colors ${
                      staffFilter === "all"
                        ? "bg-[#C9A227] text-[#0A0A0A]"
                        : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                    }`}
                  >
                    All Staff
                  </button>
                  {staff.filter(s => s.isActive).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStaffFilter(s.id)}
                      className={`font-cinzel text-xs tracking-wider px-3 py-1.5 transition-colors ${
                        staffFilter === s.id
                          ? "bg-[#C9A227] text-[#0A0A0A]"
                          : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setStaffFilter("unassigned")}
                    className={`font-cinzel text-xs tracking-wider px-3 py-1.5 transition-colors ${
                      staffFilter === "unassigned"
                        ? "bg-[#C9A227] text-[#0A0A0A]"
                        : "bg-[#141414] border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                    }`}
                  >
                    Unassigned
                  </button>
                </div>
              </div>
            </div>
            
            {bookings.length === 0 ? (
              <div className="invicta-card rounded-xl p-8 text-center">
                <p className="font-cormorant text-[#8B7355]">No bookings yet. Share your link to get started!</p>
              </div>
            ) : (
              <div className="invicta-card rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#141414]">
                    <tr>
                      <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Customer</th>
                      <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Service</th>
                      <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Barber</th>
                      <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Date/Time</th>
                      <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Status</th>
                      <th className="text-right font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Price</th>
                      <th className="text-right font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9A227]/10">
                    {bookings.filter((b) => {
                      const isPast = new Date(b.appointmentTime) < now;
                      const isToday = new Date(b.appointmentTime).toDateString() === now.toDateString();
                      const isCancelled = b.status === "cancelled";
                      const isNoShow = b.status === "noshow";
                      const isCompleted = b.status === "completed";

                      if (staffFilter === "unassigned" && b.staff !== null) return false;
                      if (staffFilter !== "all" && staffFilter !== "unassigned" && b.staff?.id !== staffFilter) return false;

                      if (bookingFilter === "today") return isToday && !isCancelled && !isNoShow;
                      if (bookingFilter === "upcoming") return !isPast && b.status === "confirmed";
                      if (bookingFilter === "completed") return isCompleted || (isPast && b.status === "confirmed");
                      if (bookingFilter === "noshow") return isNoShow;
                      if (bookingFilter === "cancelled") return isCancelled;
                      return true;
                    }).map((b) => {
                      const isPast = new Date(b.appointmentTime) < now;
                      const isCancelled = b.status === "cancelled";
                      return (
                        <tr key={b.id} className={isPast || isCancelled ? "opacity-50" : ""}>
                          <td className="px-5 py-4">
                            <p className="font-cinzel text-[#F5F0E6]">{b.customerName}</p>
                            <p className="font-cormorant text-[#8B7355] text-sm">{b.customerPhone}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-cormorant text-[#F5F0E6]">{b.service.name}</p>
                            <p className="font-cormorant text-[#8B7355] text-sm">{b.service.durationMinutes} min</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={b.staff?.id || ""}
                                onChange={(e) => handleReassignStaff(b.id, e.target.value || null)}
                                className="bg-[#141414] border border-[#C9A227]/30 px-2 py-1 text-[#F5F0E6] text-sm font-cormorant focus:outline-none focus:border-[#C9A227]"
                              >
                                <option value="">Unassigned</option>
                                {staff.filter(s => s.isActive).map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              {b.wasAutoAssigned && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-cinzel bg-blue-500/20 text-blue-400" title="Auto-assigned">
                                  Auto
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-cormorant text-[#F5F0E6]">{fmt(b.appointmentTime).date}</p>
                            <p className="font-cormorant text-[#8B7355] text-sm">{fmt(b.appointmentTime).time}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={
                              b.status === "cancelled" ? "inline-flex px-2 py-1 rounded-full text-xs font-cinzel bg-red-500/20 text-red-400" :
                                b.status === "noshow" ? "inline-flex px-2 py-1 rounded-full text-xs font-cinzel bg-orange-500/20 text-orange-400" :
                                  b.status === "completed" ? "inline-flex px-2 py-1 rounded-full text-xs font-cinzel bg-[#8B7355]/20 text-[#8B7355]" :
                                    isPast ? "inline-flex px-2 py-1 rounded-full text-xs font-cinzel bg-[#8B7355]/20 text-[#8B7355]" :
                                      "inline-flex px-2 py-1 rounded-full text-xs font-cinzel bg-green-500/20 text-green-400"
                            }>
                              {b.status === "cancelled" ? "Cancelled" :
                                b.status === "noshow" ? "No Show" :
                                  b.status === "completed" ? "Completed" :
                                    isPast ? "Completed" : "Confirmed"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="font-cinzel text-[#C9A227]">${b.service.price}</p>
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
                                  className="font-cinzel text-xs text-[#C9A227] hover:text-[#D4AF37]"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  disabled={actionLoading === b.id}
                                  className="font-cinzel text-xs text-red-400 hover:text-red-300"
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
            
            {/* Reschedule Modal */}
            {rescheduleBooking && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="invicta-card rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
                  <h3 className="font-cinzel text-[#F5F0E6] text-lg">Reschedule Appointment</h3>
                  <p className="font-cormorant text-[#8B7355]">
                    {rescheduleBooking.customerName} - {rescheduleBooking.service.name}
                  </p>
                  <div>
                    <label className="block font-cormorant text-sm text-[#8B7355] mb-1">New Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newAppointmentTime}
                      onChange={(e) => setNewAppointmentTime(e.target.value)}
                      className="w-full px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReschedule}
                      disabled={actionLoading === rescheduleBooking.id}
                      className="flex-1 font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                    >
                      {actionLoading === rescheduleBooking.id ? "Saving..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => { setRescheduleBooking(null); setNewAppointmentTime(""); }}
                      className="flex-1 font-cinzel text-xs tracking-wider px-4 py-2 border border-[#C9A227]/30 text-[#F5F0E6] hover:border-[#C9A227]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-xl text-[#F5F0E6]">Manage Services</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] transition-colors"
              >
                + Add Service
              </button>
            </div>

            {showAddForm && (
              <div className="invicta-card rounded-xl p-6 space-y-4">
                <h3 className="font-cinzel text-[#F5F0E6]">New Service</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-cormorant text-sm text-[#8B7355] mb-1">Service Name</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant placeholder-[#8B7355]/50 focus:outline-none focus:border-[#C9A227]"
                      placeholder="Haircut"
                    />
                  </div>
                  <div>
                    <label className="block font-cormorant text-sm text-[#8B7355] mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      value={newService.durationMinutes}
                      onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })}
                      className="w-full px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                    />
                  </div>
                  <div>
                    <label className="block font-cormorant text-sm text-[#8B7355] mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      className="w-full px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant placeholder-[#8B7355]/50 focus:outline-none focus:border-[#C9A227]"
                      placeholder="35"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddService}
                    disabled={saving}
                    className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Service"}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="font-cinzel text-xs tracking-wider px-4 py-2 border border-[#C9A227]/30 text-[#F5F0E6] hover:border-[#C9A227]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="invicta-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#141414]">
                  <tr>
                    <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Service</th>
                    <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Duration</th>
                    <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Price</th>
                    <th className="text-right font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/10">
                  {services.map((s) => (
                    <tr key={s.id}>
                      {editingService?.id === s.id ? (
                        <>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={editingService.name}
                              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                              className="w-full px-3 py-1 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              value={editingService.durationMinutes}
                              onChange={(e) => setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value) })}
                              className="w-20 px-3 py-1 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              value={editingService.price}
                              onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) })}
                              className="w-20 px-3 py-1 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                            />
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button onClick={handleUpdateService} disabled={saving} className="font-cinzel text-xs text-green-400 hover:text-green-300">Save</button>
                            <button onClick={() => setEditingService(null)} className="font-cinzel text-xs text-[#8B7355] hover:text-[#F5F0E6]">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 font-cormorant text-[#F5F0E6]">{s.name}</td>
                          <td className="px-5 py-4 font-cormorant text-[#8B7355]">{s.durationMinutes} min</td>
                          <td className="px-5 py-4 font-cinzel text-[#C9A227]">${s.price}</td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button onClick={() => setEditingService(s)} className="font-cinzel text-xs text-[#C9A227] hover:text-[#D4AF37]">Edit</button>
                            <button onClick={() => handleDeleteService(s.id)} className="font-cinzel text-xs text-red-400 hover:text-red-300">Delete</button>
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

        {/* AVAILABILITY TAB */}
        {activeTab === "availability" && (
          <div className="space-y-6">
            <h2 className="font-cinzel text-xl text-[#F5F0E6]">Blocked Dates</h2>
            <p className="font-cormorant text-[#8B7355]">Block off dates for vacations, holidays, or other closures. Customers won&apos;t be able to book on these dates.</p>

            <div className="invicta-card rounded-xl p-6 space-y-4">
              <h3 className="font-cinzel text-[#F5F0E6]">Add Blocked Dates</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block font-cormorant text-[#8B7355] text-sm mb-1">Start Date</label>
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
                    className="px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
                <div>
                  <label className="block font-cormorant text-[#8B7355] text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBlockedEndDate}
                    onChange={(e) => setNewBlockedEndDate(e.target.value)}
                    min={newBlockedStartDate || new Date().toISOString().split("T")[0]}
                    className="px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block font-cormorant text-[#8B7355] text-sm mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                    placeholder="e.g., Vacation, Holiday"
                    className="w-full px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant placeholder-[#8B7355]/50 focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
                <button
                  onClick={handleAddBlockedDate}
                  disabled={!newBlockedStartDate || savingBlocked}
                  className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {savingBlocked ? "Adding..." : "Block Dates"}
                </button>
              </div>
              {newBlockedStartDate && newBlockedEndDate && newBlockedStartDate !== newBlockedEndDate && (
                <p className="font-cormorant text-[#8B7355] text-sm">
                  This will block {Math.ceil((new Date(newBlockedEndDate).getTime() - new Date(newBlockedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              )}
            </div>

            <div className="invicta-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#141414]">
                  <tr>
                    <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Date</th>
                    <th className="text-left font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Reason</th>
                    <th className="text-right font-cinzel text-xs tracking-wider text-[#8B7355] px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/10">
                  {blockedDates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center font-cormorant text-[#8B7355]">No blocked dates</td>
                    </tr>
                  ) : (
                    blockedDates.map((b) => (
                      <tr key={b.id}>
                        <td className="px-5 py-4 font-cormorant text-[#F5F0E6]">
                          {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 font-cormorant text-[#8B7355]">{b.reason || "—"}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleDeleteBlockedDate(b.id)} className="font-cinzel text-xs text-red-400 hover:text-red-300">Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === "staff" && (
          <AdminStaff
            slug={demo.slug}
            initialStaff={staff}
            services={services}
            accentColor="#C9A227"
            onStaffChange={setStaff}
          />
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="font-cinzel text-xl text-[#F5F0E6]">Demo Settings</h2>
            
            {/* Shop Information */}
            <div className="invicta-card rounded-xl p-6 space-y-4">
              <h3 className="font-cinzel text-[#F5F0E6]">Shop Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-6">
                  <div className="relative">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Shop logo" className="h-20 max-w-[160px] object-contain" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center text-[#0A0A0A] font-bebas text-2xl">
                        {demo.shopName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-cormorant text-[#8B7355] text-sm mb-2">Shop Logo</p>
                    <label className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] cursor-pointer transition-colors">
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
                <div><p className="font-cormorant text-[#8B7355] text-sm">Shop Name</p><p className="font-cinzel text-[#F5F0E6]">{demo.shopName}</p></div>
                <div><p className="font-cormorant text-[#8B7355] text-sm">Owner</p><p className="font-cinzel text-[#F5F0E6]">{demo.ownerName}</p></div>
                <div><p className="font-cormorant text-[#8B7355] text-sm">Email</p><p className="font-cormorant text-[#F5F0E6]">{demo.email}</p></div>
                <div><p className="font-cormorant text-[#8B7355] text-sm">Phone</p><p className="font-cormorant text-[#F5F0E6]">{demo.phone}</p></div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="invicta-card rounded-xl p-6 space-y-4">
              <h3 className="font-cinzel text-[#F5F0E6]">Business Hours</h3>

              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.day} className="flex items-center gap-4 py-2 border-b border-[#C9A227]/10 last:border-0">
                    <div className="w-24">
                      <span className="font-cinzel text-sm text-[#F5F0E6]">{dayNames[h.day]}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={h.isOpen}
                        onChange={(e) => updateHours(h.day, "isOpen", e.target.checked)}
                        className="w-4 h-4 rounded accent-[#C9A227]"
                      />
                      <span className="font-cormorant text-[#8B7355] text-sm">{h.isOpen ? "Open" : "Closed"}</span>
                    </label>
                    {h.isOpen && (
                      <>
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={(e) => updateHours(h.day, "openTime", e.target.value)}
                          className="px-3 py-1 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] text-sm font-cormorant focus:outline-none focus:border-[#C9A227]"
                        />
                        <span className="font-cormorant text-[#8B7355]">to</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={(e) => updateHours(h.day, "closeTime", e.target.value)}
                          className="px-3 py-1 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] text-sm font-cormorant focus:outline-none focus:border-[#C9A227]"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveHours}
                disabled={savingHours}
                className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
              >
                {savingHours ? "Saving..." : "Save Hours"}
              </button>
            </div>

            {/* Booking Window */}
            <div className="invicta-card rounded-xl p-6 space-y-4">
              <h3 className="font-cinzel text-[#F5F0E6]">Booking Window</h3>
              <p className="font-cormorant text-[#8B7355] text-sm">How far in advance can customers book?</p>
              <div className="flex items-center gap-4">
                <select
                  value={bookingWindowDays}
                  onChange={(e) => setBookingWindowDays(Number(e.target.value))}
                  className="px-4 py-2 bg-[#141414] border border-[#C9A227]/30 text-[#F5F0E6] font-cormorant focus:outline-none focus:border-[#C9A227]"
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
                  className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {savingWindow ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="invicta-card rounded-xl p-6 space-y-4 border border-red-900/50">
              <h3 className="font-cinzel text-red-400">Danger Zone</h3>
              <p className="font-cormorant text-[#8B7355] text-sm">
                Reset this demo to start fresh. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="font-cinzel text-xs tracking-wider px-4 py-2 bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900 hover:text-red-300 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Reset Confirmation Modal */}
    {showResetConfirm && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="invicta-card rounded-xl p-6 max-w-md w-full space-y-4">
          <h3 className="font-cinzel text-xl text-red-400">Confirm Reset</h3>
          <p className="font-cormorant text-[#F5F0E6]">
            This will delete all bookings, staff, services, and settings. Are you sure you want to reset everything?
          </p>
          <p className="font-cormorant text-[#8B7355] text-sm">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              disabled={resetting}
              className="flex-1 font-cinzel text-xs tracking-wider px-4 py-2 border border-[#C9A227]/30 text-[#8B7355] hover:border-[#C9A227] hover:text-[#F5F0E6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex-1 font-cinzel text-xs tracking-wider px-4 py-2 bg-red-900 text-red-300 hover:bg-red-800 disabled:opacity-50 transition-colors"
            >
              {resetting ? "Resetting..." : "Yes, Reset Everything"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}