import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json().catch(() => ({}));
        const visitorId = body.visitorId;

        if (!visitorId) {
            return NextResponse.json(
                { success: false, error: "缺少访客ID" },
                { status: 400 }
            );
        }

        const post = await prisma.post.findUnique({
            where: { slug, published: true },
            select: { id: true, likeCount: true },
        });

        if (!post) {
            return NextResponse.json(
                { success: false, error: "文章不存在" },
                { status: 404 }
            );
        }

        // 使用事务保证原子性
        const result = await prisma.$transaction(async (tx) => {
            const existingLike = await tx.postLike.findUnique({
                where: {
                    visitorId_postId: {
                        visitorId,
                        postId: post.id,
                    },
                },
            });

            if (existingLike) {
                // 取消点赞
                await tx.postLike.delete({
                    where: {
                        visitorId_postId: {
                            visitorId,
                            postId: post.id,
                        },
                    },
                });
                const updated = await tx.post.update({
                    where: { id: post.id },
                    data: { likeCount: { decrement: 1 } },
                    select: { likeCount: true },
                });
                return { liked: false, likeCount: Math.max(0, updated.likeCount) };
            } else {
                // 点赞
                await tx.postLike.create({
                    data: {
                        visitorId,
                        postId: post.id,
                    },
                });
                const updated = await tx.post.update({
                    where: { id: post.id },
                    data: { likeCount: { increment: 1 } },
                    select: { likeCount: true },
                });
                return { liked: true, likeCount: updated.likeCount };
            }
        });

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Like error:", error);
        return NextResponse.json(
            { success: false, error: "操作失败" },
            { status: 500 }
        );
    }
}
