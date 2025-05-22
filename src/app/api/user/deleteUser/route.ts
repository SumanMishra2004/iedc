// src/app/api/admin/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.userType !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { emails } = body;

  if (!emails || (typeof emails !== "string" && !Array.isArray(emails))) {
    return NextResponse.json({ message: "Invalid email(s) provided" }, { status: 400 });
  }

  try {
    let result;

    if (Array.isArray(emails)) {
      // Delete multiple users
      result = await prisma.userDetails.deleteMany({
        where: {
          email: {
            in: emails,
          },
        },
      });
    } else {
      // Delete a single user
      result = await prisma.userDetails.delete({
        where: {
          email: emails,
        },
      });
    }

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
