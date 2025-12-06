import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { demo: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (!staff.phone) {
      return NextResponse.json({ error: "Staff has no phone number" }, { status: 400 });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token valid for 24 hours

    // Save token to staff record
    await prisma.staff.update({
      where: { id },
      data: {
        photoUploadToken: token,
        photoUploadExpires: expires,
      },
    });

    // Send SMS with upload link
    const uploadUrl = `https://barber-demo.ai.jdemar.com/upload-photo/${token}`;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "SMS not configured" }, { status: 500 });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const smsBody = `Hi ${staff.name}! ${staff.demo.shopName} wants you to upload your profile photo. Click here: ${uploadUrl}\n\nThis link expires in 24 hours.`;

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({
        To: staff.phone.startsWith("+") ? staff.phone : `+1${staff.phone.replace(/\D/g, "")}`,
        From: fromNumber,
        Body: smsBody,
      }),
    });

    if (!smsResponse.ok) {
      const error = await smsResponse.text();
      console.error("Twilio error:", error);
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Photo upload link sent" });
  } catch (error) {
    console.error("Send photo link error:", error);
    return NextResponse.json({ error: "Failed to send link" }, { status: 500 });
  }
}