'use client';

import { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import OnboardingWizard from './OnboardingWizard';

interface OnboardingWrapperProps {
    demo: any;
}

export default function OnboardingWrapper({ demo }: OnboardingWrapperProps) {
    const [showDashboard, setShowDashboard] = useState(false);

    if (showDashboard) {
        window.location.reload();
        return null;
    }

    const defaultHours = [0, 1, 2, 3, 4, 5, 6].map(day => {
        const existing = demo.hours.find((h: any) => h.day === day);
        return existing || {
            day,
            isOpen: day !== 0,
            openTime: '09:00',
            closeTime: '18:00',
        };
    });

    return (
        <OnboardingWizard
            demo={demo}
            initialServices={demo.services}
            initialHours={defaultHours}
            onComplete={() => setShowDashboard(true)}
        />
    );
}