import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models";

/**
 * GET /api/user/exists
 * Lightweight check used by middleware to determine if the Clerk user
 * has completed onboarding and exists in MongoDB.
 * Returns: { exists: boolean }
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ exists: false }, { status: 401 });

    await connectDB();
    const user = await User.exists({ clerkId: userId });
    if (user){
    return NextResponse.json({ exists: user });
    }
    return NextResponse.json({ exists: false });

  } catch (error) {
    console.error("[GET /api/user/exists]", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}