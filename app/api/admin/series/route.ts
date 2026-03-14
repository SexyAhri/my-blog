import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin";

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

    const { name, slug, description, coverImage } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const series = await prisma.series.create({
      data: {
        name,
        slug: generateSlug(slug),
        description,
        coverImage,
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
