import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseSettingsUpdateInput } from "@/lib/admin-payloads";
import { invalidatePublicSettingsCache, invalidateSidebarCache } from "@/lib/cache";

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
      { success: false, error: "加载设置失败" },
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

    const body = await request.json().catch(() => null);
    const parsed = parseSettingsUpdateInput(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status },
      );
    }

    const updates = Object.entries(parsed.data.values).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );

    await Promise.all(updates);
    invalidatePublicSettingsCache();
    invalidateSidebarCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: "保存设置失败" },
      { status: 500 },
    );
  }
}
