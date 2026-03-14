import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where: { approved?: boolean } = {};

    if (status === "pending") {
      where.approved = false;
    } else if (status === "approved") {
      where.approved = true;
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        post: { select: { title: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}
