"use client";

import { useState } from "react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

interface WebsiteData {
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
}

interface Props {
  slug: string;
  initialData: WebsiteData;
  initialGallery: GalleryImage[];
  accentColor: string;
}

export default function AdminWebsite({ slug, initialData, initialGallery, accentColor }: Props) {
  const [data, setData] = useState<WebsiteData>(initialData);
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/demos/${slug}/website`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    }
    setSaving(false);
  };

  const handleImageUpload = async (field: keyof WebsiteData, file: File) => {
    setUploading(field);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await res.json();
      setData({ ...data, [field]: url });
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setUploading(null);
  };

  const handleAddGalleryImage = async (file?: File) => {
    let imageUrl = newImageUrl;

    if (file) {
      setUploading("gallery");
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const { url } = await res.json();
        imageUrl = url;
      } catch (error) {
        console.error("Upload failed:", error);
        setUploading(null);
        return;
      }
      setUploading(null);
    }

    if (!imageUrl) return;

    try {
      const res = await fetch(`/api/demos/${slug}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const newImage = await res.json();
      setGallery([...gallery, newImage]);
      setNewImageUrl("");
    } catch (error) {
      console.error("Failed to add image:", error);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    try {
      await fetch(`/api/demos/${slug}/gallery?id=${id}`, {
        method: "DELETE",
      });
      setGallery(gallery.filter((img) => img.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const updateField = (field: keyof WebsiteData, value: string) => {
    setData({ ...data, [field]: value || null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Website Content</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-white font-medium">Hero Section</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Tagline (above title)</label>
            <input
              type="text"
              value={data.tagline || ""}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="e.g., Est. 2018 • South Florida"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Subtitle (below title)</label>
            <input
              type="text"
              value={data.heroSubtitle || ""}
              onChange={(e) => updateField("heroSubtitle", e.target.value)}
              placeholder="e.g., A Father & Son Tradition of Excellence"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-white font-medium">About Section</h3>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Section Title</label>
          <input
            type="text"
            value={data.aboutTitle || ""}
            onChange={(e) => updateField("aboutTitle", e.target.value)}
            placeholder="e.g., WHERE CRAFT MEETS TRADITION"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Paragraph 1</label>
          <textarea
            value={data.aboutText1 || ""}
            onChange={(e) => updateField("aboutText1", e.target.value)}
            placeholder="Tell your story..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Paragraph 2</label>
          <textarea
            value={data.aboutText2 || ""}
            onChange={(e) => updateField("aboutText2", e.target.value)}
            placeholder="Continue your story..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Signature</label>
            <input
              type="text"
              value={data.aboutSignature || ""}
              onChange={(e) => updateField("aboutSignature", e.target.value)}
              placeholder="e.g., — The Invicta Family"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">About Image</label>
            <div className="flex items-center gap-2">
              {data.aboutImageUrl && (
                <img src={data.aboutImageUrl} alt="About" className="h-10 w-10 object-cover rounded" />
              )}
              <label className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm cursor-pointer hover:bg-white/20">
                {uploading === "aboutImageUrl" ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload("aboutImageUrl", e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-white font-medium">Contact Information</h3>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Address</label>
          <input
            type="text"
            value={data.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="e.g., 123 Main Street, Hollywood, FL 33020"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Instagram URL</label>
            <input
              type="url"
              value={data.instagramUrl || ""}
              onChange={(e) => updateField("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/yourbarbershop"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Facebook URL</label>
            <input
              type="url"
              value={data.facebookUrl || ""}
              onChange={(e) => updateField("facebookUrl", e.target.value)}
              placeholder="https://facebook.com/yourbarbershop"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-white font-medium">Gallery Images</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.imageUrl}
                alt={img.altText || "Gallery image"}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={() => handleDeleteGalleryImage(img.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-gray-400 text-sm">{uploading === "gallery" ? "Uploading..." : "Add Image"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleAddGalleryImage(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}