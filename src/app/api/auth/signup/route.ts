// /api/auth/signup.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/utils/hash";
import { sendEmail } from "@/utils/mailer";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
});

export async function POST(req: Request) {
    
  const body = await req.json();

  const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    if (!name || !email || !password) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.password && await comparePassword(password, existingUser.password)) {
      // handle case if password matches (add your logic here)
      return NextResponse.json({ message: "Already registered, logged in." });
    }
  }

  const hashedPassword = await hashPassword(password);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.user.create({
    data: {
      email,
      name: name.toLowerCase().trim(),
      password: hashedPassword,
      profileImage:"/profileImage.png",
      isVerified: false,
      verificationCode: otp,
      verificationCodeExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  await sendEmail(
    email,
    "Verify your email",
    `<p>Hi ${name},</p>
     <p>Your verification code is:</p>
     <h2>${otp}</h2>`
  );

  return NextResponse.json({ message: "Verification email sent" });
}
