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
        { success: false, error: "名称和别名不能为空" },
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
        { success: false, error: "别名已存在" },
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
      message: "标签已更新",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新标签失败",
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
          error: `该标签仍被 ${postsCount} 篇文章使用`,
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
      message: "标签已删除",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除标签失败",
      },
      { status: 500 },
    );
  }
}
