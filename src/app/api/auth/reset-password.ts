import prisma from "@/lib/prisma"
import { hashPassword } from "@/utils/hash"
import { NextApiRequest,NextApiResponse } from "next"
export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: "Missing fields" })

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gte: new Date() },
    },
  })

  if (!user) return res.status(400).json({ error: "Invalid or expired token" })

  const hashed = await hashPassword(password)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  res.status(200).json({ message: "Password reset successfully" })
}
