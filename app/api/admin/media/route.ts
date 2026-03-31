import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { validateImageFile } from "@/lib/media-files";
import {
  createEmptyMediaUsageSummary,
  getMediaLibraryAudit,
  getMediaUsageMap,
  normalizeMediaPath,
  resolveUploadFilepath,
} from "@/lib/media-usage";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const includeAudit = searchParams.get("includeAudit") === "true";
    const includeUsage = searchParams.get("includeUsage") === "true" || includeAudit;
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

    if (!includeUsage) {
      return NextResponse.json({ success: true, data: media });
    }

    if (includeAudit) {
      const audit = await getMediaLibraryAudit(media.map((item) => item.filepath));
      const mediaWithAudit = media.map((item) => {
        const normalizedPath = normalizeMediaPath(item.filepath);

        return {
          ...item,
          usage: normalizedPath
            ? audit.usageMap[normalizedPath] ?? createEmptyMediaUsageSummary()
            : createEmptyMediaUsageSummary(),
          storage: normalizedPath
            ? audit.storageMap[normalizedPath] ?? {
                existsInStorage: false,
                status: "missing" as const,
              }
            : {
                existsInStorage: false,
                status: "missing" as const,
              },
        };
      });

      return NextResponse.json({
        success: true,
        data: mediaWithAudit,
        audit: {
          orphanedFiles: audit.orphanedFiles,
          brokenReferences: audit.brokenReferences,
        },
      });
    }

    const usageMap = await getMediaUsageMap(media.map((item) => item.filepath));
    const mediaWithUsage = media.map((item) => ({
      ...item,
      usage:
        usageMap[normalizeMediaPath(item.filepath) ?? item.filepath] ??
        createEmptyMediaUsageSummary(),
    }));

    return NextResponse.json({ success: true, data: mediaWithUsage });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const body = await request.json().catch(() => null);
    const filepath = normalizeMediaPath(body?.filepath);

    if (!filepath) {
      return NextResponse.json(
        { success: false, error: "A valid upload filepath is required" },
        { status: 400 },
      );
    }

    const trackedMedia = await prisma.media.findFirst({
      where: { filepath },
      select: { id: true },
    });

    if (trackedMedia) {
      return NextResponse.json(
        {
          success: false,
          error: "Tracked media must be deleted from its media record",
        },
        { status: 400 },
      );
    }

    const usageMap = await getMediaUsageMap([filepath]);
    const usage = usageMap[filepath] ?? createEmptyMediaUsageSummary();

    if (usage.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "This upload is still referenced by content or settings",
          usage,
        },
        { status: 409 },
      );
    }

    const absolutePath = resolveUploadFilepath(filepath);
    if (!absolutePath) {
      return NextResponse.json(
        { success: false, error: "Invalid upload filepath" },
        { status: 400 },
      );
    }

    if (!existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    await unlink(absolutePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete orphaned media:", error);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    const validation = validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}.${validation.data.extension}`;

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const media = await prisma.media.create({
      data: {
        filename: file.name,
        filepath: `/uploads/${filename}`,
        mimetype: file.type,
        size: file.size,
        type: "image",
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
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
