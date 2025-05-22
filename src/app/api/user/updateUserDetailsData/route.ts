import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.userType !== "ADMIN") {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 403 });
  }

  const body = await req.json();
  const { email, userType } = body;

  if (!email || (typeof email !== "string" )) {
    return new Response(JSON.stringify({ message: "Invalid email(s) provided" }), { status: 400 });
  }

  if (userType !== "STUDENT" && userType !== "FACULTY"&& userType !== "ADMIN") {
    return new Response(JSON.stringify({ message: "Invalid user type provided" }), { status: 400 });
  }

  try {
    let result;

    
      result = await prisma.userDetails.update({
        where: { email },
        data: { userType },
      });
    await prisma.user.update({
      where: { email },
      data: { userType },
    });

    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
