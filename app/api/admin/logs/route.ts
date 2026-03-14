import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "operation";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    if (type === "login") {
      const [logs, total] = await Promise.all([
        prisma.loginLog.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.loginLog.count(),
      ]);

      return NextResponse.json({
        success: true,
        data: logs,
        total,
        page,
        pageSize,
      });
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.operationLog.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}
