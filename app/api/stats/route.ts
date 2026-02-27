import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - 记录页面访问
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, postId } = body;

        const ip =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent") || "";
        const referer = request.headers.get("referer") || "";

        await prisma.pageView.create({
            data: {
                path,
                postId: postId || null,
                ip,
                userAgent,
                referer,
            },
        });

        // 浏览量由 posts/[slug]/page.tsx 服务端统一递增，此处不再重复

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: true }); // 静默失败
    }
}
