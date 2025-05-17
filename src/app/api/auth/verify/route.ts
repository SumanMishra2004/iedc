// /src/app/api/auth/varify/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, code } = await req.json();
console.log("Email:", email);
  console.log("Code:", code);

  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.varificationCode !== code) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  user = await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      varificationCode: null,
    },
  });

  return NextResponse.json({ message: "Email verified successfully",userId:user.id },{ status: 200 });
}
