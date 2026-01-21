import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "siteAnalytics" },
    });

    return NextResponse.json({
      success: true,
      code: setting?.value || null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, code: null });
  }
}
