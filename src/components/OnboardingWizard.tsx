'use client';

import { useState, useRef } from 'react';

interface Service {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
}

interface BusinessHour {
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
    logoUrl: string | null;
    accentColor: string;
}

interface OnboardingWizardProps {
    demo: Demo;
    initialServices: Service[];
    initialHours: BusinessHour[];
    onComplete: () => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OnboardingWizard({ demo, initialServices, initialHours, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [logoUrl, setLogoUrl] = useState(demo.logoUrl);
    const [uploading, setUploading] = useState(false);
    const [services, setServices] = useState<Service[]>(initialServices);
    const [hours, setHours] = useState<BusinessHour[]>(initialHours);
    const [saving, setSaving] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [newService, setNewService] = useState({ name: '', durationMinutes: 30, price: 25 });
    const [showNewServiceForm, setShowNewServiceForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalSteps = 5;
    const accentColor = demo.accentColor || '#8b5cf6';

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('demoId', demo.id);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.logoUrl) {
                setLogoUrl(data.logoUrl + '?t=' + Date.now());
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleHourChange = (day: number, field: string, value: string | boolean) => {
        setHours(hours.map(h => h.day === day ? { ...h, [field]: value } : h));
    };

    const saveHours = async () => {
        setSaving(true);
        try {
            await fetch('/api/hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demoId: demo.id, hours }),
            });
        } catch (error) {
            console.error('Failed to save hours:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddService = async () => {
        if (!newService.name) return;
        setSaving(true);
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demoId: demo.id, ...newService }),
            });
            const data = await res.json();
            setServices([...services, data]);
            setNewService({ name: '', durationMinutes: 30, price: 25 });
            setShowNewServiceForm(false);
        } catch (error) {
            console.error('Failed to add service:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateService = async (service: Service) => {
        setSaving(true);
        try {
            await fetch(`/api/services/${service.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(service),
            });
            setServices(services.map(s => s.id === service.id ? service : s));
            setEditingService(null);
        } catch (error) {
            console.error('Failed to update service:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try {
            await fetch(`/api/services/${id}`, { method: 'DELETE' });
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete service:', error);
        }
    };

    const completeOnboarding = async () => {
        setSaving(true);
        try {
            await fetch('/api/demos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demoId: demo.id, onboarded: true }),
            });
            onComplete();
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
        } finally {
            setSaving(false);
        }
    };

    const skipSetup = async () => {
        if (confirm('Skip setup and go directly to dashboard? You can always configure these settings later.')) {
            await completeOnboarding();
        }
    };

    const nextStep = async () => {
        if (step === 3) {
            await saveHours();
        }
        setStep(step + 1);
    };

    const bookingUrl = `https://barber-demo.ai.jdemar.com/demo/${demo.slug}`;

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s <= step ? 'text-white' : 'bg-gray-700 text-gray-400'
                                    }`}
                                style={{ backgroundColor: s <= step ? accentColor : undefined }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%`, backgroundColor: accentColor }}
                        />
                    </div>
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Welcome, {demo.ownerName}!</h1>
                        <p className="text-gray-300 mb-6">
                            Let&apos;s get <span className="font-semibold">{demo.shopName}</span> set up for online booking.
                            This quick wizard will help you configure:
                        </p>
                        <ul className="text-left text-gray-300 mb-8 space-y-3">
                            <li className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: accentColor }}>1</span>
                                Your shop logo
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: accentColor }}>2</span>
                                Business hours
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: accentColor }}>3</span>
                                Services &amp; pricing
                            </li>
                        </ul>
                        <p className="text-gray-400 text-sm mb-8">This only takes about 2 minutes.</p>
                    </div>
                )}

                {/* Step 2: Logo Upload */}
                {step === 2 && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Logo</h2>
                        <p className="text-gray-400 mb-6">This will appear on your booking page and customer notifications.</p>

                        <div className="mb-6">
                            {logoUrl ? (
                                <div className="relative inline-block">
                                    <img src={logoUrl} alt="Shop logo" className="w-32 h-32 object-contain mx-auto rounded-lg bg-gray-700 p-2" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-32 h-32 mx-auto border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-gray-500 transition"
                                >
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accentColor }} />
                                    ) : (
                                        <>
                                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-gray-400 text-sm">Upload Logo</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </div>
                        <p className="text-gray-500 text-sm">PNG or JPG, max 5MB</p>
                    </div>
                )}

                {/* Step 3: Business Hours */}
                {step === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Set Your Hours</h2>
                        <p className="text-gray-400 mb-6 text-center">When is your shop open for appointments?</p>

                        <div className="space-y-3">
                            {hours.map((hour) => (
                                <div key={hour.day} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg">
                                    <label className="flex items-center gap-2 w-28">
                                        <input
                                            type="checkbox"
                                            checked={hour.isOpen}
                                            onChange={(e) => handleHourChange(hour.day, 'isOpen', e.target.checked)}
                                            className="w-4 h-4 rounded"
                                            style={{ accentColor }}
                                        />
                                        <span className="text-white text-sm">{dayNames[hour.day]}</span>
                                    </label>
                                    {hour.isOpen && (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="time"
                                                value={hour.openTime}
                                                onChange={(e) => handleHourChange(hour.day, 'openTime', e.target.value)}
                                                className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                                            />
                                            <span className="text-gray-400">to</span>
                                            <input
                                                type="time"
                                                value={hour.closeTime}
                                                onChange={(e) => handleHourChange(hour.day, 'closeTime', e.target.value)}
                                                className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                                            />
                                        </div>
                                    )}
                                    {!hour.isOpen && <span className="text-gray-500 text-sm">Closed</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Services */}
                {step === 4 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Your Services</h2>
                        <p className="text-gray-400 mb-6 text-center">Review your services or add new ones.</p>

                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                            {services.map((service) => (
                                <div key={service.id} className="bg-gray-700/50 p-3 rounded-lg">
                                    {editingService?.id === service.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editingService.name}
                                                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                                className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                                            />
                                            <div className="flex gap-2 items-center">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={newService.durationMinutes}
                                                        onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}
                                                        className="w-24 bg-gray-600 text-white px-3 py-2 rounded"
                                                    />
                                                    <span className="absolute -bottom-5 left-0 text-xs text-gray-400">minutes</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-2 text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        value={newService.price}
                                                        onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                                                        className="w-24 bg-gray-600 text-white pl-6 pr-3 py-2 rounded"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateService(editingService)}
                                                    disabled={saving}
                                                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingService(null)}
                                                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-white font-medium">{service.name}</span>
                                                <span className="text-gray-400 text-sm ml-2">
                                                    {service.durationMinutes} min • ${service.price}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingService(service)}
                                                    className="p-1 text-gray-400 hover:text-white"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    className="p-1 text-gray-400 hover:text-red-400"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {showNewServiceForm ? (
                            <div className="bg-gray-700/50 p-3 rounded-lg space-y-2">
                                <input
                                    type="text"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                                    placeholder="Service name"
                                />
                                <div className="flex gap-2 items-center">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={newService.durationMinutes}
                                            onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}
                                            className="w-20 bg-gray-600 text-white px-3 py-2 rounded"
                                        />
                                        <span className="text-xs text-gray-400 ml-1">min</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-1">$</span>
                                        <input
                                            type="number"
                                            value={newService.price}
                                            onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                                            className="w-20 bg-gray-600 text-white px-3 py-2 rounded"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddService}
                                        disabled={saving || !newService.name}
                                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowNewServiceForm(false)}
                                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewServiceForm(true)}
                                className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition"
                            >
                                + Add Service
                            </button>
                        )}
                    </div>
                )}

                {/* Step 5: Complete */}
                {step === 5 && (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accentColor }}>
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h2>
                        <p className="text-gray-400 mb-6">Your booking page is ready to share with customers.</p>

                        <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                            <p className="text-gray-400 text-sm mb-2">Your booking link:</p>
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white font-medium hover:underline break-all"
                                style={{ color: accentColor }}
                            >
                                {bookingUrl}
                            </a>
                        </div>

                        <div className="text-left text-gray-300 space-y-2 mb-6">
                            <p className="font-medium text-white">What&apos;s next?</p>
                            <ul className="space-y-1 text-sm">
                                <li>• Share your booking link on social media</li>
                                <li>• Add it to your Google Business profile</li>
                                <li>• Text it to your regular customers</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <div>
                        {step > 1 && step < 5 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {step < 5 && (
                            <button
                                onClick={skipSetup}
                                className="px-4 py-2 text-gray-400 hover:text-white transition"
                            >
                                Skip Setup
                            </button>
                        )}
                        {step < 5 ? (
                            <button
                                onClick={nextStep}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50"
                                style={{ backgroundColor: accentColor }}
                            >
                                {saving ? 'Saving...' : step === 4 ? 'Finish Setup' : 'Continue'}
                            </button>
                        ) : (
                            <button
                                onClick={completeOnboarding}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50"
                                style={{ backgroundColor: accentColor }}
                            >
                                {saving ? 'Loading...' : 'Go to Dashboard'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}