import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const settings = await prisma.setting.findMany();
    const settingsObj: Record<string, string> = {};

    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    return NextResponse.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const body = await request.json();
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      }),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
