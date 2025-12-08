'use client';

import { useState } from 'react';
import OnboardingWizardInvicta from './OnboardingWizardInvicta';

interface OnboardingWrapperInvictaProps {
    demo: any;
}

export default function OnboardingWrapperInvicta({ demo }: OnboardingWrapperInvictaProps) {
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
        <OnboardingWizardInvicta
            demo={demo}
            initialServices={demo.services}
            initialHours={defaultHours}
            onComplete={() => setShowDashboard(true)}
        />
    );
}