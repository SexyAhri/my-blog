import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const keys = [
      "socialGithub",
      "socialTwitter",
      "socialWeibo",
      "socialEmail",
      "siteIcp",
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, string> = { success: "true" };
    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
