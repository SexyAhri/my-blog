import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve, sep } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const uploadsRoot = resolve(process.cwd(), "public", "uploads");
    const filePath = resolve(uploadsRoot, ...path);

    const isInUploadsDir =
      filePath === uploadsRoot || filePath.startsWith(`${uploadsRoot}${sep}`);

    if (!isInUploadsDir) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = path[path.length - 1]?.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    const contentType = mimeTypes[ext || ""] || "application/octet-stream";
    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=31536000",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    };

    if (ext === "svg" || !mimeTypes[ext || ""]) {
      headers["Content-Disposition"] = "attachment";
    }

    return new NextResponse(file, { headers });
  } catch (error) {
    console.error("Failed to serve file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 },
    );
  }
}
