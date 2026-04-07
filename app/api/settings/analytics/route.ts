import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/public-settings";

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();

    return NextResponse.json({
      success: true,
      code: settings.siteAnalytics,
    });
  } catch {
    return NextResponse.json({ success: false, code: null });
  }
}
