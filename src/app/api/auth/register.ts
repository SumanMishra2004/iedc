import prisma from "@/lib/prisma"
import { hashPassword } from "@/utils/hash"
import { sendEmail } from "@/utils/mailer"
import { NextRequest,NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      varificationCode: code,
    },
  });

  await sendEmail(email, "Verify Your Email", `<p>Your code is <strong>${code}</strong></p>`);

  return NextResponse.json({ message: "User created. Verification code sent to email." }, { status: 200 });
}
