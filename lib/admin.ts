import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

interface RequireAdminResult {
  response: NextResponse | null;
  session: Session | null;
}

export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
      session: null,
    };
  }

  if (session.user.role !== "admin") {
    return {
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      ),
      session: null,
    };
  }

  return {
    response: null,
    session,
  };
}
