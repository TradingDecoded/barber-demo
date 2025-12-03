import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!accountSid || !authToken || !fromNumber || accountSid === "your_twilio_sid") {
    console.log("Twilio not configured. Would send SMS to:", to);
    console.log("Message:", body);
    return false;
  }

  try {
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);
    
    let cleanNumber = to.replace(/[^0-9+]/g, "");
    if (!cleanNumber.startsWith("+")) {
      cleanNumber = "+1" + cleanNumber;
    }

    await client.messages.create({
      body,
      from: fromNumber,
      to: cleanNumber,
    });

    console.log("SMS sent to:", cleanNumber);
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

async function sendReminders() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  // Find bookings 23-24 hours from now that haven't had reminders sent
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      appointmentTime: {
        gte: in23Hours,
        lte: in24Hours,
      },
      status: "confirmed",
      reminderSent: false,
    },
    include: {
      demo: true,
      service: true,
    },
  });

  console.log(`Found ${upcomingBookings.length} bookings needing reminders`);

  for (const booking of upcomingBookings) {
    const apptTime = new Date(booking.appointmentTime);
    const formattedDate = apptTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = apptTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const message = `⏰ Reminder: Your ${booking.service.name} at ${booking.demo.shopName} is tomorrow!\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n\nSee you then!`;

    const sent = await sendSMS(booking.customerPhone, message);

    if (sent) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });
      console.log(`Reminder sent for booking ${booking.id}`);
    }
  }
}

async function sendReviewRequests() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  // Find bookings that ended 2-3 hours ago and haven't had review requests sent
  const completedBookings = await prisma.booking.findMany({
    where: {
      appointmentTime: {
        gte: threeHoursAgo,
        lte: twoHoursAgo,
      },
      status: "confirmed",
      reviewSent: false,
    },
    include: {
      demo: true,
      service: true,
    },
  });

  console.log(`Found ${completedBookings.length} bookings needing review requests`);

  for (const booking of completedBookings) {
    const message = `Thanks for visiting ${booking.demo.shopName} today! 🙏\n\nWe'd love to hear about your experience. If you have a moment, please leave us a review:\n\n⭐ It really helps our business!`;

    const sent = await sendSMS(booking.customerPhone, message);

    if (sent) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reviewSent: true },
      });
      console.log(`Review request sent for booking ${booking.id}`);
    }
  }
}

async function main() {
  console.log("Starting reminder/review job at", new Date().toISOString());
  
  await sendReminders();
  await sendReviewRequests();
  
  console.log("Job completed at", new Date().toISOString());
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});