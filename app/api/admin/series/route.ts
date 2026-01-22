import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - 获取所有系列
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const series = await prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取系列失败" },
      { status: 500 }
    );
  }
}

// POST - 创建系列
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { name, slug, description, coverImage } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "名称和别名不能为空" },
        { status: 400 }
      );
    }

    const series = await prisma.series.create({
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
      { success: false, error: "创建系列失败" },
      { status: 500 }
    );
  }
}
