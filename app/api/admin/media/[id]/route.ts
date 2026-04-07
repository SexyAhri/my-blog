import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { dirname } from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getFileExtension, validateImageFile } from "@/lib/media-files";
import {
  createEmptyMediaUsageSummary,
  getMediaUsageMap,
  normalizeMediaPath,
  resolveUploadFilepath,
} from "@/lib/media-usage";

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
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "媒体不存在" },
        { status: 404 },
      );
    }

    const normalizedPath = normalizeMediaPath(media.filepath);
    const usageMap = await getMediaUsageMap(
      normalizedPath ? [normalizedPath] : [],
    );
    const usage = normalizedPath
      ? usageMap[normalizedPath] ?? createEmptyMediaUsageSummary()
      : createEmptyMediaUsageSummary();

    if (usage.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "该媒体仍被内容或设置引用",
          usage,
        },
        { status: 409 },
      );
    }

    const filepath = resolveUploadFilepath(media.filepath);
    if (filepath && existsSync(filepath)) {
      await unlink(filepath);
    }

    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "媒体不存在" },
        { status: 404 },
      );
    }

    const normalizedPath = normalizeMediaPath(media.filepath);
    if (!normalizedPath) {
      return NextResponse.json(
        { success: false, error: "媒体文件路径无效" },
        { status: 400 },
      );
    }

    const absolutePath = resolveUploadFilepath(normalizedPath);
    if (!absolutePath) {
      return NextResponse.json(
        { success: false, error: "媒体文件路径无效" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "必须上传文件" },
        { status: 400 },
      );
    }

    const validation = validateImageFile(file, {
      expectedExtension: getFileExtension(normalizedPath),
    });

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    await mkdir(dirname(absolutePath), { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(bytes));

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        filename: file.name,
        mimetype: file.type,
        size: file.size,
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

    return NextResponse.json({ success: true, data: updatedMedia });
  } catch (error) {
    console.error("Failed to replace media:", error);
    return NextResponse.json(
      { success: false, error: "替换失败" },
      { status: 500 },
    );
  }
}

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
    const { alt, title } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        alt,
        title,
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
    console.error("Failed to update media:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 },
    );
  }
}
