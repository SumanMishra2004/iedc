import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/userDetails
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions }); // ✅ pass context properly

  console.log("Session from API route:", session);

  if (!session || session.user.userType !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized... only avail for admin" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { email, userType } = body;

  if (!email || !["FACULTY", "ADMIN"].includes(userType)) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  try {
    const entry = await prisma.userDetails.create({
      data: { email, userType },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
