# BizHelper.AI - Barber Demo Platform Roadmap

## Completed Features
- [x] Landing page with owner/customer selection
- [x] Demo registration for shop owners
- [x] Dynamic booking page for customers
- [x] Admin dashboard with overview, bookings, services, closures, settings tabs
- [x] Service management (add/edit/delete)
- [x] Logo upload with persistent storage
- [x] Business hours per day (different hours for each day of week)
- [x] Recurring appointments (weekly, bi-weekly, monthly)
- [x] Double booking prevention with timezone support
- [x] SMS notifications (confirmation + owner alert)
- [x] 24hr reminder cron job
- [x] Post-visit review request cron job
- [x] Cancel/reschedule appointments from admin dashboard (with SMS notification)
- [x] Booking filters in admin (All, Today, Upcoming, Completed, Cancelled)
- [x] Configurable booking window (14 days to 1 year) in settings
- [x] Improved date picker with month selector dropdown
- [x] Block off dates (vacations/closures) with date range support
- [x] TV display page (/tv/[slug]) for shop monitors
- [x] Onboarding wizard for new shop owners
- [x] Silent polling for real-time booking updates (15 seconds)
- [x] Multiple Staff/Barbers feature:
  - Staff model (name, phone, photo, bio, isActive, sortOrder)
  - Staff management in admin dashboard (add/edit/delete)
  - Staff photo upload
  - Staff-specific hours (individual schedules per barber)
  - Link services to specific staff members
  - Customers choose barber when booking (or "Any Available")
  - Booking page shows only barbers who perform selected service
  - staffId saved with bookings
  - SMS notifications include barber name

## In Progress / Next Up

### 1. Staff Feature Polish
- [ ] Show staff name in Admin Bookings tab
- [ ] Show staff name in Admin Overview upcoming appointments
- [ ] TV Display - group appointments by barber
- [ ] Filter bookings by staff member in admin
- [ ] Unassigned booking handling ("Any Available" option - shop owner assigns or auto-assign)

### 2. 15-Minute Time Slots & Duration-Based Blocking
- [ ] Change booking intervals from 30 min to 15 min
- [ ] Block multiple time slots based on service duration (e.g., 45 min service blocks 3 slots)
- [ ] Smarter availability calculation per barber

### 3. TV Display Enhancements
- [ ] "Complete" button - mark job done early, free up remaining time
- [ ] "No Show" button - clear blocked time for walk-ins, optionally send SMS
- [ ] Real-time status updates

### 4. Walk-in Availability Indicator (Customer Side)
- [ ] Show real-time chair availability on booking page
- [ ] "🟢 2 barbers available now" / "🟡 Next available in 30 min" / "🔴 Fully booked until 3:00 PM"
- [ ] Drive foot traffic for immediate openings

### 5. Staff Photo Upload via SMS Handoff
- [ ] Generate unique token/link when staff added
- [ ] SMS sent to staff member with upload link
- [ ] Simple mobile-friendly upload page
- [ ] Photo automatically attached to staff profile

## Planned Features (Future)

### Email Notifications
Send confirmation emails in addition to SMS.
- Email confirmation on booking
- Email reminders (24hr before)
- Branded email templates with shop logo
- Option to enable/disable per shop

### Google Calendar Integration
Let shop owners sync bookings to their Google Calendar.
- OAuth connection to Google
- Auto-create calendar events for new bookings
- Update/delete events when bookings change
- Option for customers to add to their calendar

### Customer Rebooking
Send a "Book again?" message after appointments.
- SMS/email X days after appointment
- Direct link to rebook same service
- Track rebooking conversion rate

### Waitlist
When a time slot is full, let customers join a waitlist.
- Waitlist signup for fully booked times
- Auto-notify when slot opens
- First-come-first-served or manual selection

### Analytics Dashboard
Show charts and insights for shop performance.
- Bookings over time (daily/weekly/monthly)
- Popular services breakdown
- Busiest days and times heatmap
- Revenue trends and projections
- Customer retention metrics

### Online Payments
Collect deposits or full payment at booking via Stripe.
- Stripe integration
- Configurable deposit amount or full payment
- Refund handling for cancellations
- Payment history in admin

### Customer Profiles
Track repeat customers and their history.
- Customer database with contact info
- Visit history and preferred services
- Notes field for preferences
- Loyalty program potential

### Automated Marketing
Re-engage customers who haven't visited recently.
- "We miss you" SMS/email campaigns
- Configurable inactivity threshold
- Special offers for returning customers
- Birthday messages (if DOB collected)