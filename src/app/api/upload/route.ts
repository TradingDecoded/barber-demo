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
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // For staff photos, we don't need demoId
    if (type === "staff") {
      const uploadDir = path.join("/var/www/barber-demo/uploads", "staff");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      const url = `/uploads/staff/${filename}`;
      return NextResponse.json({ success: true, url });
    }

    // Logo upload (existing logic)
    if (!demoId) {
      return NextResponse.json(
        { error: "demoId is required for logo upload" },
        { status: 400 }
      );
    }

    const demo = await prisma.demo.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      return NextResponse.json(
        { error: "Demo not found" },
        { status: 404 }
      );
    }

    const uploadDir = path.join("/var/www/barber-demo/uploads", demoId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `logo.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

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