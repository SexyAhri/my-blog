import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin";

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
    const { name, slug, description, coverImage } = await request.json();

    const series = await prisma.series.update({
      where: { id },
      data: {
        name,
        slug: generateSlug(slug),
        description,
        coverImage,
      },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Series name or slug already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update series" },
      { status: 500 },
    );
  }
}

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

    await prisma.post.updateMany({
      where: { seriesId: id },
      data: { seriesId: null, seriesOrder: null },
    });

    await prisma.series.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete series" },
      { status: 500 },
    );
  }
}
