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

export default function OnboardingWizardInvicta({ demo, initialServices, initialHours, onComplete }: OnboardingWizardProps) {
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
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            {/* Decorative corner elements */}
            <div className="fixed top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-[#C9A227]/30 pointer-events-none" />
            <div className="fixed top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-[#C9A227]/30 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-[#C9A227]/30 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-[#C9A227]/30 pointer-events-none" />

            <div className="invicta-card rounded-none max-w-2xl w-full p-8 border border-[#C9A227]/30">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div
                                key={s}
                                className={`w-10 h-10 flex items-center justify-center font-cinzel text-sm ${
                                    s < step
                                        ? 'bg-[#C9A227] text-[#0A0A0A]'
                                        : s === step
                                        ? 'bg-[#C9A227] text-[#0A0A0A]'
                                        : 'bg-[#141414] border border-[#C9A227]/30 text-[#8B7355]'
                                }`}
                            >
                                {s < step ? '✓' : s}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-[#141414] relative">
                        <div
                            className="absolute left-0 top-0 h-full bg-[#C9A227] transition-all duration-300"
                            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center mx-auto mb-6">
                            <span className="font-bebas text-3xl text-[#0A0A0A]">{demo.shopName.charAt(0)}</span>
                        </div>
                        <h2 className="font-cinzel text-3xl text-[#F5F0E6] mb-3 tracking-wider">Welcome, {demo.ownerName}</h2>
                        <p className="font-cormorant text-[#8B7355] text-lg mb-8">
                            Let&apos;s set up <span className="text-[#C9A227]">{demo.shopName}</span> in just a few minutes.
                        </p>
                        <div className="text-left space-y-4 font-cormorant text-[#F5F0E6]">
                            <div className="flex items-center gap-4 p-4 bg-[#141414] border-l-2 border-[#C9A227]">
                                <span className="text-[#C9A227] font-cinzel">1</span>
                                <span>Upload your shop logo</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-[#141414] border-l-2 border-[#C9A227]/50">
                                <span className="text-[#C9A227] font-cinzel">2</span>
                                <span>Set your business hours</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-[#141414] border-l-2 border-[#C9A227]/30">
                                <span className="text-[#C9A227] font-cinzel">3</span>
                                <span>Add your services</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Logo Upload */}
                {step === 2 && (
                    <div className="text-center">
                        <h2 className="font-cinzel text-2xl text-[#F5F0E6] mb-2 tracking-wider">Upload Your Logo</h2>
                        <p className="font-cormorant text-[#8B7355] mb-8">This will appear on your booking page</p>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[#C9A227]/30 p-8 cursor-pointer hover:border-[#C9A227] transition-colors group"
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="max-h-32 mx-auto" />
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-[#141414] border border-[#C9A227]/30 flex items-center justify-center mx-auto mb-4 group-hover:border-[#C9A227] transition-colors">
                                        <svg className="w-8 h-8 text-[#8B7355] group-hover:text-[#C9A227] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="font-cormorant text-[#8B7355] group-hover:text-[#C9A227] transition-colors">Click to upload your logo</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </div>
                        {uploading && <p className="font-cormorant text-[#C9A227] mt-4">Uploading...</p>}
                        {logoUrl && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="font-cinzel text-xs tracking-wider mt-4 text-[#8B7355] hover:text-[#C9A227] transition-colors"
                            >
                                Change Logo
                            </button>
                        )}
                    </div>
                )}

                {/* Step 3: Business Hours */}
                {step === 3 && (
                    <div>
                        <h2 className="font-cinzel text-2xl text-[#F5F0E6] mb-2 tracking-wider text-center">Business Hours</h2>
                        <p className="font-cormorant text-[#8B7355] mb-6 text-center">When is your shop open?</p>

                        <div className="space-y-3">
                            {hours.map((h) => (
                                <div key={h.day} className="flex items-center gap-4 p-3 bg-[#141414] border border-[#C9A227]/10">
                                    <div className="w-24">
                                        <span className="font-cinzel text-sm text-[#F5F0E6]">{dayNames[h.day]}</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={h.isOpen}
                                            onChange={(e) => handleHourChange(h.day, 'isOpen', e.target.checked)}
                                            className="w-4 h-4 accent-[#C9A227]"
                                        />
                                        <span className="font-cormorant text-[#8B7355] text-sm">{h.isOpen ? 'Open' : 'Closed'}</span>
                                    </label>
                                    {h.isOpen && (
                                        <>
                                            <input
                                                type="time"
                                                value={h.openTime}
                                                onChange={(e) => handleHourChange(h.day, 'openTime', e.target.value)}
                                                className="px-3 py-1 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] text-sm font-cormorant focus:outline-none focus:border-[#C9A227]"
                                            />
                                            <span className="font-cormorant text-[#8B7355]">to</span>
                                            <input
                                                type="time"
                                                value={h.closeTime}
                                                onChange={(e) => handleHourChange(h.day, 'closeTime', e.target.value)}
                                                className="px-3 py-1 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] text-sm font-cormorant focus:outline-none focus:border-[#C9A227]"
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Services */}
                {step === 4 && (
                    <div>
                        <h2 className="font-cinzel text-2xl text-[#F5F0E6] mb-2 tracking-wider text-center">Your Services</h2>
                        <p className="font-cormorant text-[#8B7355] mb-6 text-center">Add the services you offer</p>

                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                            {services.map((service) => (
                                <div key={service.id} className="p-4 bg-[#141414] border border-[#C9A227]/10">
                                    {editingService?.id === service.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editingService.name}
                                                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                                className="w-full bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                            />
                                            <div className="flex gap-3 items-center">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={editingService.durationMinutes}
                                                        onChange={(e) => setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value) })}
                                                        className="w-20 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                                    />
                                                    <span className="font-cormorant text-[#8B7355] text-sm">min</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-cormorant text-[#8B7355]">$</span>
                                                    <input
                                                        type="number"
                                                        value={editingService.price}
                                                        onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) })}
                                                        className="w-20 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateService(editingService)}
                                                    disabled={saving}
                                                    className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingService(null)}
                                                    className="font-cinzel text-xs tracking-wider px-4 py-2 border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-cinzel text-[#F5F0E6]">{service.name}</span>
                                                <span className="font-cormorant text-[#8B7355] text-sm ml-3">
                                                    {service.durationMinutes} min • ${service.price}
                                                </span>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setEditingService(service)}
                                                    className="text-[#8B7355] hover:text-[#C9A227] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    className="text-[#8B7355] hover:text-red-400 transition-colors"
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
                            <div className="p-4 bg-[#141414] border border-[#C9A227]/30 space-y-3">
                                <input
                                    type="text"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    className="w-full bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                    placeholder="Service name"
                                />
                                <div className="flex gap-3 items-center">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={newService.durationMinutes}
                                            onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}
                                            className="w-20 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                        />
                                        <span className="font-cormorant text-[#8B7355] text-sm">min</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-cormorant text-[#8B7355]">$</span>
                                        <input
                                            type="number"
                                            value={newService.price}
                                            onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                                            className="w-20 bg-[#0A0A0A] border border-[#C9A227]/30 text-[#F5F0E6] px-3 py-2 font-cormorant focus:outline-none focus:border-[#C9A227]"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddService}
                                        disabled={saving || !newService.name}
                                        className="font-cinzel text-xs tracking-wider px-4 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowNewServiceForm(false)}
                                        className="font-cinzel text-xs tracking-wider px-4 py-2 border border-[#C9A227]/30 text-[#8B7355] hover:text-[#C9A227] hover:border-[#C9A227]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewServiceForm(true)}
                                className="w-full py-3 border-2 border-dashed border-[#C9A227]/30 text-[#8B7355] hover:border-[#C9A227] hover:text-[#C9A227] transition-colors font-cormorant"
                            >
                                + Add Service
                            </button>
                        )}
                    </div>
                )}

                {/* Step 5: Complete */}
                {step === 5 && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="font-cinzel text-3xl text-[#F5F0E6] mb-3 tracking-wider">You&apos;re All Set!</h2>
                        <p className="font-cormorant text-[#8B7355] text-lg mb-8">Your shop is ready. Click below to go to your dashboard.</p>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-[#C9A227]/20">
                    <div>
                        {step > 1 && step < 5 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="font-cinzel text-xs tracking-wider text-[#8B7355] hover:text-[#C9A227] transition-colors"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {step < 5 && (
                            <button
                                onClick={skipSetup}
                                className="font-cinzel text-xs tracking-wider text-[#8B7355] hover:text-[#C9A227] transition-colors"
                            >
                                Skip Setup
                            </button>
                        )}
                        {step < 5 ? (
                            <button
                                onClick={nextStep}
                                disabled={saving}
                                className="font-cinzel text-xs tracking-wider px-6 py-3 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Saving...' : step === 4 ? 'Finish Setup' : 'Continue'}
                            </button>
                        ) : (
                            <button
                                onClick={completeOnboarding}
                                disabled={saving}
                                className="font-cinzel text-xs tracking-wider px-6 py-3 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] disabled:opacity-50 transition-colors"
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