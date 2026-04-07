import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/public-settings";

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();

    return NextResponse.json({
      success: true,
      socialGithub: settings.socialGithub,
      socialTwitter: settings.socialTwitter,
      socialWeibo: settings.socialWeibo,
      socialEmail: settings.socialEmail,
      siteIcp: settings.siteIcp,
    });
  } catch {
    return NextResponse.json({ success: false });
  }
}
