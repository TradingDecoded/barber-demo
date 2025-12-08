"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface BusinessHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Staff {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  altText: string | null;
}

interface Demo {
  slug: string;
  shopName: string;
  phone: string;
  logoUrl: string | null;
  accentColor: string;
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
  services: Service[];
  hours: BusinessHours[];
  staff: Staff[];
  galleryImages: GalleryImage[];
}

interface Props {
  demo: Demo;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function LandingPage({ demo }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const accentColor = demo.accentColor || "#C9A227";

  // Group hours for display
  const formatHoursForDisplay = () => {
    const groups: { days: string; hours: string }[] = [];
    type HourGroup = { startDay: number; endDay: number; openTime: string; closeTime: string; isOpen: boolean };
    let currentGroup: HourGroup | null = null;

    demo.hours.forEach((h) => {
      if (!currentGroup) {
        currentGroup = { startDay: h.day, endDay: h.day, openTime: h.openTime, closeTime: h.closeTime, isOpen: h.isOpen };
      } else if (h.isOpen === currentGroup.isOpen && h.openTime === currentGroup.openTime && h.closeTime === currentGroup.closeTime) {
        currentGroup.endDay = h.day;
      } else {
        // Push current group
        if (currentGroup.isOpen) {
          const dayRange = currentGroup.startDay === currentGroup.endDay
            ? dayNames[currentGroup.startDay]
            : `${dayNames[currentGroup.startDay]} - ${dayNames[currentGroup.endDay]}`;
          groups.push({ days: dayRange, hours: `${formatTime(currentGroup.openTime)} - ${formatTime(currentGroup.closeTime)}` });
        } else {
          const dayRange = currentGroup.startDay === currentGroup.endDay
            ? dayNames[currentGroup.startDay]
            : `${dayNames[currentGroup.startDay]} - ${dayNames[currentGroup.endDay]}`;
          groups.push({ days: dayRange, hours: "Closed" });
        }
        currentGroup = { startDay: h.day, endDay: h.day, openTime: h.openTime, closeTime: h.closeTime, isOpen: h.isOpen };
      }
    });

    // Push last group
    const lastGroup = currentGroup as HourGroup | null;
    if (lastGroup) {
      if (lastGroup.isOpen) {
        const dayRange = lastGroup.startDay === lastGroup.endDay
          ? dayNames[lastGroup.startDay]
          : `${dayNames[lastGroup.startDay]} - ${dayNames[lastGroup.endDay]}`;
        groups.push({ days: dayRange, hours: `${formatTime(lastGroup.openTime)} - ${formatTime(lastGroup.closeTime)}` });
      } else {
        const dayRange = lastGroup.startDay === lastGroup.endDay
          ? dayNames[lastGroup.startDay]
          : `${dayNames[lastGroup.startDay]} - ${dayNames[lastGroup.endDay]}`;
        groups.push({ days: dayRange, hours: "Closed" });
      }
    }

    return groups;
  };

  const hoursDisplay = formatHoursForDisplay();

  return (
    <>
      <style jsx global>{`
        :root {
          --gold: ${accentColor};
          --gold-light: ${accentColor};
          --gold-dark: ${accentColor}99;
          --black: #0A0A0A;
          --black-light: #141414;
          --black-lighter: #1a1a1a;
          --cream: #F5F0E6;
          --cream-muted: rgba(245, 240, 230, 0.7);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Cormorant Garamond', serif;
          background-color: var(--black);
          color: var(--cream);
          overflow-x: hidden;
          line-height: 1.6;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1000;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes lineFloat {
          0%, 100% { transform: translateY(-10%); }
          50% { transform: translateY(10%); }
        }

        @keyframes scrollPulse {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.5); opacity: 0.5; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-400 ${
          scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-lg py-4 px-8" : "py-6 px-8"
        }`}
        style={{
          background: scrolled ? undefined : "linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0) 100%)",
        }}
      >
        <a href="#" className="font-[Cinzel] text-lg font-semibold tracking-[0.3em]" style={{ color: accentColor }}>
          {demo.shopName.toUpperCase()}
        </a>
        <ul className="hidden md:flex gap-12 list-none">
          {["About", "Services", "Gallery", "Contact"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className="font-[Cinzel] text-xs tracking-[0.2em] uppercase text-[var(--cream-muted)] hover:text-[var(--gold)] transition-colors relative group"
              >
                {item}
                <span
                  className="absolute bottom-[-4px] left-0 w-0 h-[1px] group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: accentColor }}
                />
              </a>
            </li>
          ))}
        </ul>
        <Link
          href={`/demo/${demo.slug}`}
          className="font-[Cinzel] text-xs tracking-[0.15em] uppercase px-6 py-3 bg-transparent border cursor-pointer transition-all hover:text-[var(--black)]"
          style={{ borderColor: accentColor, color: accentColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Book Now
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 20% 80%, ${accentColor}14 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${accentColor}0d 0%, transparent 40%), linear-gradient(180deg, var(--black) 0%, var(--black-light) 100%)`,
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div
            className="absolute w-[1px] h-full left-[20%] animate-[lineFloat_8s_ease-in-out_infinite]"
            style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)` }}
          />
          <div
            className="absolute w-[1px] h-full right-[20%] animate-[lineFloat_8s_ease-in-out_infinite_reverse]"
            style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)` }}
          />
        </div>
        <div className="relative z-10 text-center px-8">
          {demo.tagline && (
            <div
              className="inline-flex items-center gap-3 px-6 py-2 mb-12 animate-[fadeInDown_1s_ease_forwards] opacity-0"
              style={{ border: `1px solid ${accentColor}4d` }}
            >
              <span className="font-[Cinzel] text-[0.65rem] tracking-[0.3em] uppercase" style={{ color: accentColor }}>
                {demo.tagline}
              </span>
            </div>
          )}
          <h1 className="font-['Bebas_Neue'] text-[clamp(4rem,15vw,12rem)] font-normal tracking-[0.05em] leading-[0.9] text-[var(--cream)] mb-4 animate-[fadeInUp_1s_ease_0.2s_forwards] opacity-0">
            {demo.shopName.toUpperCase()}
            <span className="block text-[0.4em] tracking-[0.4em] mt-2" style={{ color: accentColor }}>
              Barber Shop
            </span>
          </h1>
          {demo.heroSubtitle && (
            <p className="font-['Cormorant_Garamond'] text-xl font-light italic text-[var(--cream-muted)] mb-12 animate-[fadeInUp_1s_ease_0.4s_forwards] opacity-0">
              {demo.heroSubtitle}
            </p>
          )}
          <div className="flex gap-6 justify-center animate-[fadeInUp_1s_ease_0.6s_forwards] opacity-0">
            <Link
              href={`/demo/${demo.slug}`}
              className="font-[Cinzel] text-xs tracking-[0.2em] uppercase py-5 px-12 border-none cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: accentColor, color: "var(--black)", boxShadow: `0 10px 30px ${accentColor}4d` }}
            >
              Book Appointment
            </Link>
            <a
              href="#services"
              className="font-[Cinzel] text-xs tracking-[0.2em] uppercase py-5 px-12 bg-transparent border border-[var(--cream-muted)] text-[var(--cream)] cursor-pointer transition-all hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              View Services
            </a>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[fadeInUp_1s_ease_0.8s_forwards] opacity-0">
          <span className="font-[Cinzel] text-[0.6rem] tracking-[0.3em] uppercase" style={{ color: `${accentColor}99` }}>
            Scroll
          </span>
          <div
            className="w-[1px] h-10 animate-[scrollPulse_2s_ease-in-out_infinite]"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, transparent)` }}
          />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-40 px-8 md:px-16 relative">
        <div className="grid md:grid-cols-2 gap-24 max-w-[1400px] mx-auto items-center">
          <div className="relative">
            <div className="relative aspect-[4/5] bg-[var(--black-lighter)] overflow-hidden">
              <img
                src={demo.aboutImageUrl || "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80"}
                alt="About"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[1px]" style={{ backgroundColor: accentColor }} />
              <span className="font-[Cinzel] text-xs tracking-[0.3em] uppercase" style={{ color: accentColor }}>
                Our Story
              </span>
            </div>
            <h2 className="font-['Bebas_Neue'] text-[clamp(2.5rem,5vw,4rem)] font-normal tracking-[0.02em] leading-[1.1] text-[var(--cream)] mb-8">
              {demo.aboutTitle || "WHERE CRAFT MEETS TRADITION"}
            </h2>
            {demo.aboutText1 && (
              <p className="text-lg text-[var(--cream-muted)] mb-6 leading-relaxed">{demo.aboutText1}</p>
            )}
            {demo.aboutText2 && (
              <p className="text-lg text-[var(--cream-muted)] mb-8 leading-relaxed">{demo.aboutText2}</p>
            )}
            {demo.aboutSignature && (
              <p className="font-['Cormorant_Garamond'] text-xl italic" style={{ color: accentColor }}>
                {demo.aboutSignature}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-40 px-8 md:px-16" style={{ backgroundColor: "var(--black-light)" }}>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="font-[Cinzel] text-xs tracking-[0.3em] uppercase" style={{ color: accentColor }}>
              What We Offer
            </span>
          </div>
          <h2 className="font-['Bebas_Neue'] text-[clamp(2.5rem,5vw,4rem)] font-normal tracking-[0.05em] text-[var(--cream)]">
            OUR SERVICES
          </h2>
          <p className="font-['Cormorant_Garamond'] text-xl text-[var(--cream-muted)] mt-4">
            Premium grooming services tailored to the modern gentleman
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          {demo.services.map((service) => (
            <div
              key={service.id}
              className="p-8 border transition-all hover:-translate-y-1 group"
              style={{ backgroundColor: "var(--black)", borderColor: `${accentColor}1a` }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accentColor}4d`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${accentColor}1a`)}
            >
              <h3 className="font-[Cinzel] text-lg tracking-[0.1em] text-[var(--cream)] mb-4">{service.name}</h3>
              <div className="font-['Bebas_Neue'] text-3xl" style={{ color: accentColor }}>
                ${service.price}{" "}
                <span className="text-base text-[var(--cream-muted)]">/ {service.durationMinutes} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      {demo.galleryImages.length > 0 && (
        <section id="gallery" className="py-40 px-8 md:px-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="font-[Cinzel] text-xs tracking-[0.3em] uppercase" style={{ color: accentColor }}>
                Our Work
              </span>
            </div>
            <h2 className="font-['Bebas_Neue'] text-[clamp(2.5rem,5vw,4rem)] font-normal tracking-[0.05em] text-[var(--cream)]">
              THE GALLERY
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-[1400px] mx-auto">
            {demo.galleryImages.map((img, idx) => (
              <div
                key={img.id}
                className={`relative overflow-hidden ${idx === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.altText || "Gallery image"}
                  className="w-full h-full object-cover aspect-square transition-transform duration-500 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-40 px-8 md:px-16" style={{ backgroundColor: "var(--black-light)" }}>
        <div className="grid md:grid-cols-2 gap-16 max-w-[1200px] mx-auto">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[1px]" style={{ backgroundColor: accentColor }} />
              <span className="font-[Cinzel] text-xs tracking-[0.3em] uppercase" style={{ color: accentColor }}>
                Get In Touch
              </span>
            </div>
            <h2 className="font-['Bebas_Neue'] text-[clamp(2.5rem,5vw,4rem)] font-normal tracking-[0.02em] text-[var(--cream)] mb-12">
              VISIT US
            </h2>
            <div className="space-y-8">
              {demo.address && (
                <div className="flex gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <strong className="text-[var(--cream)] block mb-1">Location</strong>
                    <span className="text-[var(--cream-muted)]">{demo.address}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <svg className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <div>
                  <strong className="text-[var(--cream)] block mb-1">Phone</strong>
                  <span className="text-[var(--cream-muted)]">{demo.phone}</span>
                </div>
              </div>
              {hoursDisplay.length > 0 && (
                <div className="flex gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <div>
                    <strong className="text-[var(--cream)] block mb-2">Hours</strong>
                    <div className="space-y-1">
                      {hoursDisplay.map((h, idx) => (
                        <div key={idx} className="flex justify-between gap-8 text-[var(--cream-muted)]">
                          <span>{h.days}</span>
                          <span>{h.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="p-8 md:p-12" style={{ backgroundColor: "var(--black)" }}>
            <h3 className="font-[Cinzel] text-xl tracking-[0.1em] text-[var(--cream)] mb-8">Book Your Appointment</h3>
            <p className="text-[var(--cream-muted)] mb-8">
              Ready for a fresh look? Book your appointment online and we&apos;ll take care of the rest.
            </p>
            <Link
              href={`/demo/${demo.slug}`}
              className="block w-full text-center font-[Cinzel] text-sm tracking-[0.2em] uppercase py-4 transition-all hover:opacity-90"
              style={{ backgroundColor: accentColor, color: "var(--black)" }}
            >
              Book Online Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 text-center" style={{ borderTop: `1px solid ${accentColor}1a` }}>
        <div className="font-[Cinzel] text-2xl font-semibold tracking-[0.3em] mb-6" style={{ color: accentColor }}>
          {demo.shopName.toUpperCase()}
        </div>
        {demo.heroSubtitle && (
          <p className="font-['Cormorant_Garamond'] italic text-[var(--cream-muted)] mb-8">{demo.heroSubtitle}</p>
        )}
        <div className="flex justify-center gap-6 mb-8">
          {demo.instagramUrl && (
            <a
              href={demo.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center border transition-all hover:text-[var(--black)]"
              style={{ borderColor: `${accentColor}4d`, color: accentColor }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          )}
          {demo.facebookUrl && (
            <a
              href={demo.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center border transition-all hover:text-[var(--black)]"
              style={{ borderColor: `${accentColor}4d`, color: accentColor }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </a>
          )}
          <a
            href={`tel:${demo.phone}`}
            className="w-10 h-10 flex items-center justify-center border transition-all hover:text-[var(--black)]"
            style={{ borderColor: `${accentColor}4d`, color: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </a>
        </div>
        <p className="text-sm" style={{ color: `${accentColor}99` }}>
          © {new Date().getFullYear()} {demo.shopName}. All rights reserved.
        </p>
      </footer>
    </>
  );
}