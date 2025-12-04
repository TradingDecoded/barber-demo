import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const demoId = formData.get("demoId") as string;

    if (!file || !demoId) {
      return NextResponse.json(
        { error: "File and demoId are required" },
        { status: 400 }
      );
    }

    // Verify demo exists
    const demo = await prisma.demo.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      return NextResponse.json(
        { error: "Demo not found" },
        { status: 404 }
      );
    }

    // Create upload directory for this demo
    const uploadDir = path.join("/var/www/barber-demo/uploads", demoId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Get file extension and create filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `logo.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update demo with logo URL
    const logoUrl = `/uploads/${demoId}/${filename}`;
    await prisma.demo.update({
      where: { id: demoId },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}