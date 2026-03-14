import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { invalidateTaxonomyCaches } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const finalSlug = generateSlug(slug);
    const existing = await prisma.tag.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
      },
    });

    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      data: tag,
      message: "Tag updated",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update tag",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const postsCount = await prisma.postTag.count({
      where: { tagId: id },
    });

    if (postsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Tag is still used by ${postsCount} posts`,
        },
        { status: 400 },
      );
    }

    await prisma.tag.delete({
      where: { id },
    });

    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      message: "Tag deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete tag",
      },
      { status: 500 },
    );
  }
}
