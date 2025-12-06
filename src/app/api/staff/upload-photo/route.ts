import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const staffId = formData.get("staffId") as string;
    const token = formData.get("token") as string;

    if (!file || !staffId || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token matches staff
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.photoUploadToken !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if token is expired
    if (staff.photoUploadExpires && new Date() > staff.photoUploadExpires) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "staff");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const photoUrl = `/uploads/staff/${filename}`;

    // Update staff record and clear token
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        photoUrl,
        photoUploadToken: null,
        photoUploadExpires: null,
      },
    });

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error("Staff photo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}