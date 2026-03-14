import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 },
      );
    }

    const filepath = join(process.cwd(), "public", media.filepath);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const body = await request.json();
    const { alt, title } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        alt,
        title,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error("Failed to update media:", error);
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 },
    );
  }
}
