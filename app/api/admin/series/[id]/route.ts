import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - 更新系列
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { id } = await params;
    const { name, slug, description, coverImage } = await request.json();

    const series = await prisma.series.update({
      where: { id },
      data: { name, slug, description, coverImage },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "系列名称或别名已存在" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "更新系列失败" },
      { status: 500 }
    );
  }
}

// DELETE - 删除系列
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { id } = await params;

    // 先将该系列下的文章的 seriesId 设为 null
    await prisma.post.updateMany({
      where: { seriesId: id },
      data: { seriesId: null, seriesOrder: null },
    });

    await prisma.series.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "删除系列失败" },
      { status: 500 }
    );
  }
}
