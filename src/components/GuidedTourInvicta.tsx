'use client';

import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string; // CSS selector or 'none' for center modal
  title: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  tab?: string; // Which tab to switch to before showing this step
}

interface GuidedTourInvictaProps {
  slug: string;
  demoId: string;
  onComplete: () => void;
  setActiveTab: (tab: string) => void;
}

const tourSteps: TourStep[] = [
  {
    target: 'none',
    title: 'Welcome to Your Dashboard!',
    message: "Let's take a quick tour to help you get started. This will only take a minute.",
    position: 'center',
  },
  {
    target: '[data-tour="staff-tab"]',
    title: '⭐ Add Your Staff First!',
    message: "This is the most important step. Add your barbers here before testing bookings. Each staff member gets their own schedule and services.",
    position: 'bottom',
    tab: 'staff',
  },
  {
    target: '[data-tour="services-tab"]',
    title: 'Your Services',
    message: "We've added some default services to get you started. Edit prices, durations, or add new services here.",
    position: 'bottom',
    tab: 'services',
  },
  {
    target: '[data-tour="availability-tab"]',
    title: 'Block Off Dates',
    message: "Use this tab to block dates for vacations, holidays, or any closures outside your normal business hours.",
    position: 'bottom',
    tab: 'availability',
  },
  {
    target: '[data-tour="bookings-tab"]',
    title: 'Manage Bookings',
    message: "All appointments show up here. You can reschedule, cancel, or mark them complete.",
    position: 'bottom',
    tab: 'bookings',
  },
  {
    target: '[data-tour="overview-tab"]',
    title: 'Daily Overview',
    message: "Your home base. See today's appointments, upcoming bookings, and quick stats at a glance.",
    position: 'bottom',
    tab: 'overview',
  },
  {
    target: '[data-tour="settings-tab"]',
    title: 'Settings',
    message: "Update your business hours, booking window, upload a logo, and more.",
    position: 'bottom',
    tab: 'settings',
  },
  {
    target: '[data-tour="view-website"]',
    title: 'Preview Your Site',
    message: "Click here anytime to see what your customers see when they book.",
    position: 'bottom',
  },
  {
    target: 'none',
    title: "You're All Set! 🎉",
    message: "Remember: Add your staff first, then test a booking yourself. You can always reset the demo from Settings if you want to start fresh.",
    position: 'center',
  },
];

export default function GuidedTourInvicta({ slug, demoId, onComplete, setActiveTab }: GuidedTourInvictaProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowClass, setArrowClass] = useState('');

  const step = tourSteps[currentStep];

  const positionTooltip = useCallback(() => {
    if (step.position === 'center' || step.target === 'none') {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setArrowClass('');
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      setArrowClass('');
      return;
    }

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const padding = 12;

    let top = 0;
    let left = 0;
    let arrow: React.CSSProperties = {};
    let arrowClassName = '';

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = { top: -8, left: '50%', transform: 'translateX(-50%)' };
        arrowClassName = 'arrow-top';
        break;
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = { bottom: -8, left: '50%', transform: 'translateX(-50%)' };
        arrowClassName = 'arrow-bottom';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        arrow = { right: -8, top: '50%', transform: 'translateY(-50%)' };
        arrowClassName = 'arrow-right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        arrow = { left: -8, top: '50%', transform: 'translateY(-50%)' };
        arrowClassName = 'arrow-left';
        break;
    }

    // Keep tooltip on screen
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > window.innerHeight - 10) top = window.innerHeight - tooltipHeight - 10;

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    });
    setArrowStyle(arrow);
    setArrowClass(arrowClassName);
  }, [step]);

  useEffect(() => {
    // Switch tab if needed
    if (step.tab) {
      setActiveTab(step.tab);
    }

    // Small delay to let tab content render
    const timer = setTimeout(() => {
      positionTooltip();
    }, 100);

    window.addEventListener('resize', positionTooltip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [currentStep, step, setActiveTab, positionTooltip]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = async () => {
    try {
      await fetch('/api/demos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId, tourCompleted: true }),
      });
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    setActiveTab('staff');
    onComplete();
  };

  // Highlight the target element
  const getHighlightStyle = (): React.CSSProperties | null => {
    if (step.position === 'center' || step.target === 'none') return null;
    
    const element = document.querySelector(step.target);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      border: '2px solid #C9A227',
      borderRadius: '8px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
      pointerEvents: 'none',
      zIndex: 9998,
    };
  };

  const highlightStyle = getHighlightStyle();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9997]" />

      {/* Highlight box */}
      {highlightStyle && <div style={highlightStyle} />}

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="z-[9999] w-80 bg-[#1A1A1A] border border-[#C9A227] rounded-xl shadow-2xl"
      >
        {/* Arrow */}
        {arrowClass && (
          <div
            style={arrowStyle}
            className={`absolute w-4 h-4 bg-[#1A1A1A] border-[#C9A227] transform rotate-45 ${
              arrowClass === 'arrow-top' ? 'border-l border-t' :
              arrowClass === 'arrow-bottom' ? 'border-r border-b' :
              arrowClass === 'arrow-left' ? 'border-l border-b' :
              'border-r border-t'
            }`}
          />
        )}

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-cormorant text-[#8B7355] text-sm">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <div className="flex gap-1">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentStep ? 'bg-[#C9A227]' : 'bg-[#333]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <h3 className="font-cinzel text-lg text-[#F5F0E6] mb-2">{step.title}</h3>
          <p className="font-cormorant text-[#8B7355] mb-5 leading-relaxed">{step.message}</p>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="font-cinzel text-xs tracking-wider text-[#8B7355] hover:text-[#C9A227] transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="font-cinzel text-xs tracking-wider px-5 py-2 bg-[#C9A227] text-[#0A0A0A] hover:bg-[#D4AF37] transition-colors"
            >
              {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}