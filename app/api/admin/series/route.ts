import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseSeriesMutationInput } from "@/lib/admin-payloads";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const series = await prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ success: true, data: series });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch series" },
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
    const parsed = parseSeriesMutationInput(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status },
      );
    }

    const series = await prisma.series.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        coverImage: parsed.data.coverImage,
      },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Series name or slug already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create series" },
      { status: 500 },
    );
  }
}
