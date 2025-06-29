import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role and normalize to lowercase for comparison
    const userRole = session.user?.role?.toLowerCase();

    // Case insensitive check for admin role
    const isAdmin = userRole === 'admin';

    return NextResponse.json({ isAdmin });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 