import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET - 获取所有媒体文件
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        const where = type ? { type } : {};

        const media = await prisma.media.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: media });
    } catch (error) {
        console.error("Failed to fetch media:", error);
        return NextResponse.json(
            { success: false, error: "获取媒体文件失败" },
            { status: 500 },
        );
    }
}

// POST - 上传媒体文件
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "未找到文件" },
                { status: 400 },
            );
        }

        // 验证文件类型
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "不支持的文件类型" },
                { status: 400 },
            );
        }

        // 验证扩展名白名单（防止 MIME 伪造）
        const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !allowedExtensions.includes(ext)) {
            return NextResponse.json(
                { success: false, error: "不支持的文件扩展名" },
                { status: 400 },
            );
        }

        // 验证文件大小（最大 5MB）
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: "文件大小不能超过 5MB" },
                { status: 400 },
            );
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}-${randomStr}.${ext}`;

        // 创建上传目录
        const uploadDir = join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 保存文件
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // 保存到数据库
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "用户不存在" },
                { status: 404 },
            );
        }

        const media = await prisma.media.create({
            data: {
                filename: file.name,
                filepath: `/uploads/${filename}`,
                mimetype: file.type,
                size: file.size,
                type: file.type.startsWith("image/") ? "image" : "file",
                userId: user.id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: media });
    } catch (error) {
        console.error("Failed to upload media:", error);
        return NextResponse.json(
            { success: false, error: "上传失败" },
            { status: 500 },
        );
    }
}
