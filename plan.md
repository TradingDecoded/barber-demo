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

## Planned Features

### 1. Multiple Staff/Barbers
Allow shops to add multiple barbers, each with their own schedule and bookings.
- Add Staff model (name, photo, bio, specialties)
- Staff-specific availability/hours
- Customers choose their barber when booking
- Staff column in admin bookings view
- Individual barber performance stats

### 2. Email Notifications
Send confirmation emails in addition to SMS.
- Email confirmation on booking
- Email reminders (24hr before)
- Branded email templates with shop logo
- Option to enable/disable per shop

### 3. Google Calendar Integration
Let shop owners sync bookings to their Google Calendar.
- OAuth connection to Google
- Auto-create calendar events for new bookings
- Update/delete events when bookings change
- Option for customers to add to their calendar

### 4. Customer Rebooking
Send a "Book again?" message after appointments.
- SMS/email X days after appointment
- Direct link to rebook same service
- Track rebooking conversion rate

### 5. Waitlist
When a time slot is full, let customers join a waitlist.
- Waitlist signup for fully booked times
- Auto-notify when slot opens
- First-come-first-served or manual selection

### 6. Analytics Dashboard
Show charts and insights for shop performance.
- Bookings over time (daily/weekly/monthly)
- Popular services breakdown
- Busiest days and times heatmap
- Revenue trends and projections
- Customer retention metrics

### 7. Online Payments
Collect deposits or full payment at booking via Stripe.
- Stripe integration
- Configurable deposit amount or full payment
- Refund handling for cancellations
- Payment history in admin

### 8. Customer Profiles
Track repeat customers and their history.
- Customer database with contact info
- Visit history and preferred services
- Notes field for preferences
- Loyalty program potential

### 9. Automated Marketing
Re-engage customers who haven't visited recently.
- "We miss you" SMS/email campaigns
- Configurable inactivity threshold
- Special offers for returning customers
- Birthday messages (if DOB collected)