import prisma from "@/lib/prisma"
import { comparePassword } from "@/utils/hash"
import { NextApiRequest,NextApiResponse } from "next"

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: "Missing fields" })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) return res.status(401).json({ error: "Invalid credentials" })
  if (!user.isVerified) return res.status(403).json({ error: "Email not verified" })

  const isValid = await comparePassword(password, user.password)
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" })

  // You can use NextAuth session instead of manual JWT for managing session
  res.status(200).json({ message: "Login successful", user })
}
