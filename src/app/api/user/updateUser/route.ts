import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.userType !== "ADMIN") {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 403,
    });
  }

  const body = await req.json();
  const { email, userType, name, position } = body;

  if (!email || typeof email !== "string") {
    return new Response(
      JSON.stringify({ message: "Invalid email provided" }),
      { status: 400 }
    );
  }

  try {
    // Update userType if provided
    if (userType) {
      await prisma.userDetails.updateMany({
        where: { email },
        data: { userType },
      });

      await prisma.user.updateMany({
        where: { email },
        data: { userType },
      });
    }

    // Build update object for user
    const userUpdateData: Record<string, any> = {};
    if (name) userUpdateData.name = name;
    if (position) userUpdateData.position = position;

    let result = null;
    if (Object.keys(userUpdateData).length > 0) {
      result = await prisma.user.update({
        where: { email },
        data: userUpdateData,
      });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
