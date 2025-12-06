"use client";

import { useState, useEffect } from "react";

interface WalkInAvailabilityProps {
  demoId: string;
}

export default function WalkInAvailability({ demoId }: WalkInAvailabilityProps) {
  const [availability, setAvailability] = useState<{
    isOpen: boolean;
    availableNow: number;
    totalStaff: number;
    message: string;
    availableStaffNames?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAvailability = async () => {
    try {
      const offset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/availability?demoId=${demoId}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailability();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAvailability, 60000);
    return () => clearInterval(interval);
  }, [demoId]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 mb-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48"></div>
      </div>
    );
  }

  if (!availability) return null;

  const getStatusColor = () => {
    if (!availability.isOpen) return "bg-gray-500";
    if (availability.availableNow === 0) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStatusEmoji = () => {
    if (!availability.isOpen) return "🔴";
    if (availability.availableNow === 0) return "🟠";
    return "🟢";
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusEmoji()}</span>
          <div>
            <p className="text-white font-medium">
              {availability.isOpen ? (
                availability.availableNow > 0 ? (
                  <>
                    <span className="text-green-400">{availability.availableNow}</span>
                    {" "}barber{availability.availableNow !== 1 ? "s" : ""} available now
                  </>
                ) : (
                  <span className="text-orange-400">All barbers currently busy</span>
                )
              ) : (
                <span className="text-gray-400">{availability.message}</span>
              )}
            </p>
            {availability.isOpen && availability.availableStaffNames && availability.availableStaffNames.length > 0 && (
              <p className="text-sm text-gray-400">
                {availability.availableStaffNames.join(", ")}
              </p>
            )}
          </div>
        </div>
        {availability.isOpen && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Walk-ins welcome</p>
          </div>
        )}
      </div>
    </div>
  );
}