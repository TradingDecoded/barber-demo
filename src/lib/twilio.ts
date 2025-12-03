import type { Twilio } from "twilio";

let client: Twilio | null = null;

function getClient(): Twilio | null {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken || accountSid === "your_twilio_sid") {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require("twilio");
  client = twilio(accountSid, authToken);
  return client;
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const twilioClient = getClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioClient || !fromNumber) {
    console.log("Twilio not configured. Would send SMS to:", to);
    console.log("Message:", body);
    return false;
  }

  try {
    let cleanNumber = to.replace(/[^0-9+]/g, "");
    if (!cleanNumber.startsWith("+")) {
      cleanNumber = "+1" + cleanNumber;
    }

    await twilioClient.messages.create({
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