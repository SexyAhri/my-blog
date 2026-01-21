import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [postsPerPage, enableComments] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "postsPerPage" } }),
      prisma.setting.findUnique({ where: { key: "enableComments" } }),
    ]);

    return NextResponse.json({
      success: true,
      postsPerPage: postsPerPage?.value || "10",
      enableComments: enableComments?.value === "true",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      postsPerPage: "10",
      enableComments: true,
    });
  }
}
