import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { invalidateTaxonomyCaches } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const tags = await prisma.tag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch tags",
      },
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
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const finalSlug = generateSlug(slug);
    const existing = await prisma.tag.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug: finalSlug,
      },
    });

    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      data: tag,
      message: "Tag created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create tag",
      },
      { status: 500 },
    );
  }
}
