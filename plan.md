# BizHelper.AI - Barber Demo Platform Roadmap

**Last Updated:** December 7, 2025  
**Live URL:** https://barber-demo.ai.jdemar.com

---

## ✅ Completed Features

### Core Booking System
- [x] Landing page with owner/customer selection
- [x] Demo registration for shop owners (creates unique slug)
- [x] Dynamic booking page for customers (`/demo/[slug]`)
- [x] Multi-step booking flow (Service → Date/Time → Customer Info)
- [x] 15-minute time slot intervals
- [x] Duration-based slot blocking (prevents double bookings)
- [x] Timezone-aware booking with UTC storage
- [x] Configurable booking window (14 days to 1 year)
- [x] Month selector dropdown for date picker
- [x] Past time slots automatically hidden on same-day bookings

### Recurring Appointments
- [x] One-time, weekly, bi-weekly, and monthly options
- [x] Configurable number of appointments (4, 8, 12)
- [x] Recurring group ID for tracking related bookings
- [x] Price calculation display for recurring series

### Multi-Staff/Barber System
- [x] Staff model with name, phone, photo, bio, isActive, sortOrder
- [x] Staff management in admin dashboard (add/edit/delete)
- [x] Staff-specific hours (individual schedules per barber)
- [x] Link services to specific staff members
- [x] Customer barber selection during booking
- [x] "Any Available" option for flexible booking
- [x] Booking page filters barbers by selected service
- [x] Staff ID saved with bookings
- [x] Staff name displayed in admin bookings and overview
- [x] Staff photo upload via direct upload in admin
- [x] Staff photo upload via SMS handoff link (token-based, 24hr expiry)

### Admin Dashboard (`/admin/[slug]`)
- [x] Overview tab with stats (Today's bookings, upcoming, revenue)
- [x] Today's Schedule with status badges
- [x] Bookings tab with filters (All, Today, Upcoming, Completed, Cancelled)
- [x] Services tab (add/edit/delete services)
- [x] Closures tab (block date ranges with reasons)
- [x] Staff tab (full staff management)
- [x] Settings tab (logo, hours, booking window, demo code)
- [x] Silent polling for real-time updates (every 15 seconds)
- [x] Cancel/reschedule appointments with SMS notifications
- [x] Logo upload with persistent storage

### Business Hours
- [x] Per-day business hours (different for each day of week)
- [x] Open/closed toggle per day
- [x] Custom open/close times
- [x] Staff-specific hours that override shop hours

### Date Blocking/Closures
- [x] Block single dates or date ranges
- [x] Optional reason field for closures
- [x] Visual day counter for multi-day ranges
- [x] Blocked dates shown in booking calendar
- [x] Delete blocked dates from admin

### SMS Notifications (Twilio)
- [x] Booking confirmation to customer
- [x] New booking alert to shop owner
- [x] Staff name included in SMS when applicable
- [x] Manage booking link in confirmation SMS
- [x] Cancel/reschedule notifications
- [x] 24-hour reminder cron job (23-24hr window)
- [x] Post-visit review request cron job (2-3hr window)
- [x] 10DLC registration support

### Customer Self-Service (`/manage/[token]`)
- [x] Unique manage token per booking
- [x] Manage link included in confirmation SMS
- [x] Mobile-friendly booking details page
- [x] Cancel button with confirmation modal
- [x] Reschedule option with available slots
- [x] SMS notification to shop on changes
- [x] Calendar integration (Add to Calendar button)

### TV Display (`/tv/[slug]`)
- [x] Full-screen display for shop monitors
- [x] Live clock with current date
- [x] "Now Serving" section (current appointment)
- [x] "Up Next" section
- [x] Complete today's schedule list
- [x] Filter by barber
- [x] Complete/No Show buttons with status updates
- [x] Status badges (In Progress, Completed, No Show)
- [x] Auto-refresh every 60 seconds
- [x] Booking URL footer

### Walk-in Availability Indicator
- [x] Real-time chair availability on booking page
- [x] Color-coded status (🟢 available / 🟠 busy / 🔴 closed)
- [x] Shows number of available barbers
- [x] Lists available barber names
- [x] 15-minute buffer before upcoming appointments
- [x] Auto-refresh every 60 seconds

### Calendar Integration
- [x] ICS file generation for appointments
- [x] "Add to Calendar" button on booking confirmation
- [x] "Add to Calendar" button on manage booking page
- [x] 1-hour reminder alarm in calendar event
- [x] Includes service, staff, and location details

### Status Tracking
- [x] Confirmed, completed, noshow, cancelled statuses
- [x] Revenue calculation only counts completed appointments
- [x] Reminder/review sent tracking per booking

### Onboarding Wizard
- [x] 5-step guided setup for new shop owners
- [x] Welcome screen with overview
- [x] Logo upload step
- [x] Business hours configuration
- [x] Services setup with add/edit/delete
- [x] Completion screen with booking URL
- [x] Skip setup option to go directly to dashboard
- [x] Progress indicator

---

## 🔄 Partially Complete / Needs Polish

### Staff Feature Improvements
- [x] Filter bookings by staff member in admin Bookings tab ✅ (Dec 7, 2025)
- [x] "Any Available" auto-assignment logic ✅ (Dec 7, 2025)

### Reschedule Flow Bug
- [x] RescheduleBooking.tsx malformed JSX fixed ✅ (Dec 7, 2025)

---

## 📋 Planned Features (Future)

### Email Notifications
- [ ] Email confirmation on booking
- [ ] Email reminders (24hr before)
- [ ] Branded email templates with shop logo
- [ ] Option to enable/disable per shop

### Google Calendar Integration
- [ ] OAuth connection to Google
- [ ] Auto-create calendar events for new bookings
- [ ] Update/delete events when bookings change
- [ ] Two-way sync option

### Customer Rebooking
- [ ] SMS/email X days after appointment
- [ ] Direct link to rebook same service
- [ ] Track rebooking conversion rate

### Waitlist
- [ ] Waitlist signup for fully booked times
- [ ] Auto-notify when slot opens
- [ ] First-come-first-served or manual selection

### Analytics Dashboard
- [ ] Bookings over time (daily/weekly/monthly)
- [ ] Popular services breakdown
- [ ] Busiest days and times heatmap
- [ ] Revenue trends and projections
- [ ] Customer retention metrics
- [ ] Staff performance comparison

### Online Payments
- [ ] Stripe integration
- [ ] Configurable deposit amount or full payment
- [ ] Refund handling for cancellations
- [ ] Payment history in admin

### Customer Profiles
- [ ] Customer database with contact info
- [ ] Visit history and preferred services
- [ ] Notes field for preferences
- [ ] Loyalty program potential

### Automated Marketing
- [ ] "We miss you" SMS/email campaigns
- [ ] Configurable inactivity threshold
- [ ] Special offers for returning customers
- [ ] Birthday messages (if DOB collected)

---

## 🏗️ Technical Architecture

### Tech Stack
- **Framework:** Next.js 14 with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **SMS:** Twilio (10DLC registered)
- **Process Manager:** PM2
- **Web Server:** NGINX with SSL
- **Hosting:** Vultr VPS

### Database Models
- **Demo:** Shop configuration and branding
- **Staff:** Barbers with individual schedules
- **StaffHours:** Per-day schedule per staff member
- **StaffService:** Service-to-staff assignments
- **Service:** Available services with pricing
- **Booking:** Customer appointments with status tracking
- **BusinessHours:** Shop-level operating hours
- **BlockedDate:** Vacation/closure dates

### Key Files Structure
```
/src/app
├── page.tsx                    # Landing page
├── admin/[slug]/page.tsx       # Admin dashboard
├── demo/[slug]/page.tsx        # Customer booking page
├── manage/[token]/page.tsx     # Customer manage booking
├── manage/[token]/reschedule/  # Reschedule flow
├── tv/[slug]/page.tsx          # TV display
├── upload-photo/[token]/       # Staff photo upload
└── api/
    ├── availability/           # Walk-in availability
    ├── blocked-dates/          # Closure management
    ├── bookings/               # Booking CRUD
    ├── bookings/check/         # Slot availability
    ├── bookings/manage/[token]/ # Customer cancel/reschedule
    ├── demos/                  # Demo CRUD
    ├── demos/[slug]/staff/     # Staff management
    ├── hours/                  # Business hours
    ├── services/               # Service management
    ├── staff/                  # Staff operations
    └── upload/                 # File uploads

/src/components
├── AdminDashboard.tsx
├── AdminStaff.tsx
├── BookingForm.tsx
├── ManageBooking.tsx
├── OnboardingWizard.tsx
├── OnboardingWrapper.tsx
├── RescheduleBooking.tsx
├── StaffPhotoUpload.tsx
├── TVDisplay.tsx
└── WalkInAvailability.tsx

/src/lib
├── calendar.ts                 # ICS file generation
├── prisma.ts                   # Database client
└── twilio.ts                   # SMS helper

/scripts
├── run-reminders.sh            # Cron wrapper
└── send-reminders.ts           # Reminder/review job
```

### Cron Jobs
- **Reminders:** Runs hourly, sends SMS 23-24 hours before appointments
- **Review Requests:** Runs hourly, sends SMS 2-3 hours after appointments

---

## 🐛 Known Issues

None currently tracked.

---

## 📝 Notes

- All times stored in UTC, converted to local for display
- Booking tokens are 32-character hex strings (crypto.randomBytes)
- Photo upload tokens expire after 24 hours
- SMS includes deep links for manage/reschedule
- Revenue only calculated from "completed" status appointments