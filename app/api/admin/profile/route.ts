import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseProfileUpdateInput } from "@/lib/admin-payloads";

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
    const body = await request.json().catch(() => null);
    const parsed = parseProfileUpdateInput(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status },
      );
    }

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

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.image !== undefined) {
      updateData.image = parsed.data.image;
    }

    if (parsed.data.hasPasswordUpdate) {
      const isPasswordValid = await compare(
        parsed.data.currentPassword!,
        user.password,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      const isSamePassword = await compare(
        parsed.data.newPassword!,
        user.password,
      );
      if (isSamePassword) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be different from the current password",
          },
          { status: 400 },
        );
      }

      updateData.password = await hash(parsed.data.newPassword!, 12);
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
