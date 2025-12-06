'use client';

import { useState, useRef } from 'react';

interface StaffHours {
  id: string;
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface StaffService {
  id: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
  };
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
  services: StaffService[];
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface AdminStaffProps {
  slug: string;
  initialStaff: Staff[];
  services: Service[];
  accentColor: string;
  onStaffChange?: (staff: Staff[]) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminStaff({ slug, initialStaff, services, accentColor, onStaffChange }: AdminStaffProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [editingServicesId, setEditingServicesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    isActive: true,
  });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [hoursData, setHoursData] = useState<{ day: number; isOpen: boolean; openTime: string; closeTime: string }[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ name: '', phone: '', bio: '', isActive: true });
    setPhotoPreview(null);
    setSelectedServiceIds([]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB. Please resize your image and try again.');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'staff');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();
      if (data.url) {
        setPhotoPreview(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, photoUrl: photoPreview }),
    });

    if (res.ok) {
      let newStaff = await res.json();

      // Save services if any selected
      if (selectedServiceIds.length > 0) {
        const servicesRes = await fetch(`/api/demos/${slug}/staff/${newStaff.id}/services`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceIds: selectedServiceIds }),
        });
        if (servicesRes.ok) {
          newStaff = await servicesRes.json();
        }
      }

      const updated = [...staff, newStaff];
      setStaff(updated);
      onStaffChange?.(updated);
      resetForm();
    }
    setLoading(false);
  };

  const handleEdit = (s: Staff) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      phone: s.phone || '',
      bio: s.bio || '',
      isActive: s.isActive,
    });
    setPhotoPreview(s.photoUrl);
    setSelectedServiceIds(s.services.map(ss => ss.serviceId));
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, photoUrl: photoPreview }),
    });

    if (res.ok) {
      const updatedStaff = await res.json();
      const updated = staff.map(s => s.id === editingId ? updatedStaff : s);
      setStaff(updated);
      onStaffChange?.(updated);
      resetForm();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${id}`, { method: 'DELETE' });

    if (res.ok) {
      const updated = staff.filter(s => s.id !== id);
      setStaff(updated);
      onStaffChange?.(updated);
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete');
    }
    setLoading(false);
  };

  const handleSendPhotoLink = async (staffId: string) => {
    if (!confirm('Send a photo upload link via SMS to this staff member?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/staff/${staffId}/send-photo-link`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert('Photo upload link sent successfully!');
      } else {
        alert(data.error || 'Failed to send link');
      }
    } catch (error) {
      alert('Failed to send link');
    }

    setLoading(false);
  };

  const openHoursEditor = (s: Staff) => {
    setEditingHoursId(s.id);
    const existingHours = s.hours || [];
    const hoursMap = new Map(existingHours.map(h => [h.day, h]));

    setHoursData(DAYS.map((_, i) => {
      const existing = hoursMap.get(i);
      return {
        day: i,
        isOpen: existing?.isOpen ?? (i >= 1 && i <= 5),
        openTime: existing?.openTime ?? '09:00',
        closeTime: existing?.closeTime ?? '18:00',
      };
    }));
  };

  const handleSaveHours = async () => {
    if (!editingHoursId) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${editingHoursId}/hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: hoursData }),
    });

    if (res.ok) {
      const updatedStaff = await res.json();
      const updated = staff.map(s => s.id === editingHoursId ? { ...s, hours: updatedStaff.hours } : s);
      setStaff(updated);
      onStaffChange?.(updated);
      setEditingHoursId(null);
    }
    setLoading(false);
  };

  const openServicesEditor = (s: Staff) => {
    setEditingServicesId(s.id);
    setSelectedServices(s.services.map(ss => ss.serviceId));
  };

  const handleSaveServices = async () => {
    if (!editingServicesId) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${editingServicesId}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceIds: selectedServices }),
    });

    if (res.ok) {
      const updatedStaff = await res.json();
      const updated = staff.map(s => s.id === editingServicesId ? updatedStaff : s);
      setStaff(updated);
      onStaffChange?.(updated);
      setEditingServicesId(null);
    }
    setLoading(false);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Staff Members</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90"
          >
            + Add Staff
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl text-gray-400 overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  formData.name ? formData.name.charAt(0).toUpperCase() : '?'
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-sm border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Add Photo'}
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="ml-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500"
              rows={2}
              placeholder="Short bio or specialties..."
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Services Performed</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-white/5 rounded-lg p-3">
              {services.map(service => (
                <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedServiceIds([...selectedServiceIds, service.id]);
                      } else {
                        setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">{service.name}</span>
                </label>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-gray-500 text-sm">No services created yet. Add services first.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-400">Active (available for bookings)</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={loading || !formData.name.trim()}
              style={{ backgroundColor: accentColor }}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add Staff'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hours Editor Modal */}
      {editingHoursId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Schedule</h3>
            <div className="space-y-3">
              {hoursData.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={h.isOpen}
                    onChange={e => {
                      const updated = [...hoursData];
                      updated[i].isOpen = e.target.checked;
                      setHoursData(updated);
                    }}
                    className="rounded"
                  />
                  <span className="w-24 text-sm text-gray-300">{DAYS[h.day]}</span>
                  {h.isOpen && (
                    <>
                      <input
                        type="time"
                        value={h.openTime}
                        onChange={e => {
                          const updated = [...hoursData];
                          updated[i].openTime = e.target.value;
                          setHoursData(updated);
                        }}
                        className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={h.closeTime}
                        onChange={e => {
                          const updated = [...hoursData];
                          updated[i].closeTime = e.target.value;
                          setHoursData(updated);
                        }}
                        className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveHours}
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90"
              >
                {loading ? 'Saving...' : 'Save Hours'}
              </button>
              <button
                onClick={() => setEditingHoursId(null)}
                className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Editor Modal */}
      {editingServicesId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Assign Services</h3>
            <p className="text-sm text-gray-400 mb-4">Select services this staff member can perform:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {services.map(service => (
                <label key={service.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded"
                  />
                  <span className="text-white">{service.name}</span>
                  <span className="text-gray-500 text-sm ml-auto">${service.price}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveServices}
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90"
              >
                {loading ? 'Saving...' : 'Save Services'}
              </button>
              <button
                onClick={() => setEditingServicesId(null)}
                className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="space-y-4">
        {staff.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No staff members yet. Add your first barber above.</p>
        ) : (
          staff.map(s => (
            <div key={s.id} className={`glass-card rounded-xl p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl text-gray-400">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      s.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {s.name}
                      {!s.isActive && <span className="ml-2 text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Inactive</span>}
                    </h3>
                    {s.phone && <p className="text-sm text-gray-400">{s.phone}</p>}
                    {s.bio && <p className="text-sm text-gray-500 mt-1">{s.bio}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{s.hours?.filter(h => h.isOpen).length || 0} days/week</span>
                      <span>{s.services?.length || 0} services</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openHoursEditor(s)}
                    className="text-sm px-3 py-1 border border-white/20 text-gray-400 rounded hover:bg-white/5"
                  >
                    Hours
                  </button>
                  <button
                    onClick={() => openServicesEditor(s)}
                    className="text-sm px-3 py-1 border border-white/20 text-gray-400 rounded hover:bg-white/5"
                  >
                    Services
                  </button>
                  {s.phone && (
                    <button
                      onClick={() => handleSendPhotoLink(s.id)}
                      className="text-sm px-3 py-1 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/10"
                    >
                      📷 Send Photo Link
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(s)}
                    className="text-sm px-3 py-1 border border-white/20 text-gray-400 rounded hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-sm px-3 py-1 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}