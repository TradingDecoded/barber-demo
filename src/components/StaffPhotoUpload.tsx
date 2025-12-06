"use client";

import { useState, useRef } from "react";

interface StaffPhotoUploadProps {
  staffId: string;
  token: string;
  currentPhoto: string | null;
}

export default function StaffPhotoUpload({ staffId, token, currentPhoto }: StaffPhotoUploadProps) {
  const [photo, setPhoto] = useState<string | null>(currentPhoto);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("staffId", staffId);
      formData.append("token", token);

      const res = await fetch("/api/staff/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPhoto(data.photoUrl);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">Photo Uploaded!</h2>
        <p className="text-gray-400 mb-6">Your profile photo has been updated.</p>
        {photo && (
          <div className="flex justify-center">
            <img
              src={photo}
              alt="Your photo"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Current Photo */}
      <div className="flex justify-center mb-6">
        {photo ? (
          <img
            src={photo}
            alt="Current photo"
            className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div>
            <div className="animate-spin text-4xl mb-2">⏳</div>
            <p className="text-gray-400">Uploading...</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-white font-medium mb-1">Tap to select a photo</p>
            <p className="text-gray-500 text-sm">JPG, PNG up to 5MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 text-red-400 text-center text-sm">{error}</div>
      )}

      <p className="mt-6 text-gray-500 text-xs text-center">
        Tip: Use a well-lit photo with your face clearly visible
      </p>
    </div>
  );
}