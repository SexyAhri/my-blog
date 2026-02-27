import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

// GET - 获取所有标签
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "未授权" },
                { status: 401 },
            );
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
                error: error instanceof Error ? error.message : "获取标签失败",
            },
            { status: 500 },
        );
    }
}

// POST - 创建标签
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "未授权" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { success: false, error: "名称和 slug 不能为空" },
                { status: 400 },
            );
        }

        // 检查 slug 是否已存在
        const existing = await prisma.tag.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "URL 别名已存在" },
                { status: 400 },
            );
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                slug: generateSlug(slug),
            },
        });

        return NextResponse.json({
            success: true,
            data: tag,
            message: "标签创建成功",
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "创建标签失败",
            },
            { status: 500 },
        );
    }
}
