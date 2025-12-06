'use client';

import { useState } from 'react';

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
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminStaff({ slug, initialStaff, services, accentColor }: AdminStaffProps) {
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

  const [hoursData, setHoursData] = useState<{ day: number; isOpen: boolean; openTime: string; closeTime: string }[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({ name: '', phone: '', bio: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const newStaff = await res.json();
      setStaff([...staff, newStaff]);
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
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updated = await res.json();
      setStaff(staff.map(s => s.id === editingId ? updated : s));
      resetForm();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;
    setLoading(true);

    const res = await fetch(`/api/demos/${slug}/staff/${id}`, { method: 'DELETE' });

    if (res.ok) {
      setStaff(staff.filter(s => s.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete');
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
      const updated = await res.json();
      setStaff(staff.map(s => s.id === editingHoursId ? { ...s, hours: updated.hours } : s));
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
      const updated = await res.json();
      setStaff(staff.map(s => s.id === editingServicesId ? updated : s));
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
        <h2 className="text-xl font-semibold text-gray-900">Staff Members</h2>
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
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              placeholder="Short bio or specialties..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active (available for bookings)</label>
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
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hours Editor Modal */}
      {editingHoursId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Schedule</h3>
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
                  <span className="w-24 text-sm">{DAYS[h.day]}</span>
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
                        className="border rounded px-2 py-1 text-sm"
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
                        className="border rounded px-2 py-1 text-sm"
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
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Editor Modal */}
      {editingServicesId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Services</h3>
            <p className="text-sm text-gray-600 mb-4">Select services this staff member can perform:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {services.map(service => (
                <label key={service.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded"
                  />
                  <span>{service.name}</span>
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
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
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
            <div key={s.id} className={`border rounded-lg p-4 ${!s.isActive ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-500">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      s.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {s.name}
                      {!s.isActive && <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">Inactive</span>}
                    </h3>
                    {s.phone && <p className="text-sm text-gray-600">{s.phone}</p>}
                    {s.bio && <p className="text-sm text-gray-500 mt-1">{s.bio}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{s.hours?.filter(h => h.isOpen).length || 0} days/week</span>
                      <span>{s.services?.length || 0} services</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openHoursEditor(s)}
                    className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    Hours
                  </button>
                  <button
                    onClick={() => openServicesEditor(s)}
                    className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    Services
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-sm px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
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