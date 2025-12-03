"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"select" | "owner" | "customer">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoCode, setDemoCode] = useState("");

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
  });

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push(`/admin/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoCode.trim()) {
      router.push(`/demo/${demoCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💈</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Booking <span className="gradient-text">Demo</span>
          </h1>
          <p className="text-gray-400">
            Experience AI-powered booking for barbershops
          </p>
        </div>

        {/* Mode Selection */}
        {mode === "select" && (
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <p className="text-center text-gray-300 mb-6">I am a...</p>
            
            <button
              onClick={() => setMode("owner")}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🏪</span>
              Shop Owner
            </button>
            
            <button
              onClick={() => setMode("customer")}
              className="w-full py-4 px-6 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
            >
              <span className="text-2xl">👤</span>
              Customer
            </button>

            <p className="text-center text-gray-500 text-sm mt-6">
              Shop owners create a demo. Customers book appointments.
            </p>
          </div>
        )}

        {/* Owner Registration Form */}
        {mode === "owner" && (
          <form onSubmit={handleOwnerSubmit} className="glass-card rounded-2xl p-8 space-y-5">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              ← Back
            </button>
            
            <h2 className="text-xl font-semibold text-white text-center">
              Create Your Demo
            </h2>

            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-300 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                id="shopName"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Fresh Cuts Barbershop"
              />
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="ownerName"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Marcus Johnson"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="marcus@freshcuts.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="(555) 123-4567"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create My Demo"}
            </button>
          </form>
        )}

        {/* Customer Demo Code Entry */}
        {mode === "customer" && (
          <form onSubmit={handleCustomerSubmit} className="glass-card rounded-2xl p-8 space-y-5">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              ← Back
            </button>

            <h2 className="text-xl font-semibold text-white text-center">
              Book an Appointment
            </h2>

            <p className="text-gray-400 text-sm text-center">
              Enter the demo code provided by the shop owner
            </p>

            <div>
              <label htmlFor="demoCode" className="block text-sm font-medium text-gray-300 mb-2">
                Demo Code
              </label>
              <input
                type="text"
                id="demoCode"
                required
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="fresh-cuts-abc123"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Go to Booking
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by <span className="text-purple-400">BizHelper.AI</span>
        </p>
      </div>
    </div>
  );
}