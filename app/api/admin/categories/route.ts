import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

// GET - 获取所有分类
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: "未授权" },
                { status: 401 },
            );
        }

        const categories = await prisma.category.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { posts: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "获取分类失败",
            },
            { status: 500 },
        );
    }
}

// POST - 创建分类
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
        const { name, slug, description } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { success: false, error: "名称和 slug 不能为空" },
                { status: 400 },
            );
        }

        // 检查 slug 是否已存在
        const existing = await prisma.category.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "URL 别名已存在" },
                { status: 400 },
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug: generateSlug(slug),
                description,
            },
        });

        return NextResponse.json({
            success: true,
            data: category,
            message: "分类创建成功",
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "创建分类失败",
            },
            { status: 500 },
        );
    }
}
