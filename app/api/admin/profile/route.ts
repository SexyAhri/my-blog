import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const body = await request.json();
    const { name, image, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, string | null> = {};

    if (name) {
      updateData.name = name;
    }

    if (image !== undefined) {
      updateData.image = image || null;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required" },
          { status: 400 },
        );
      }

      const isPasswordValid = await compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 },
        );
      }

      updateData.password = await hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
