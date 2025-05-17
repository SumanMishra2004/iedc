import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/prisma"
import { NextApiRequest,NextApiResponse } from "next"
import { sendEmail } from "@/utils/mailer"

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email required" })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: "User not found" })

  const token = uuidv4()
  const expiry = new Date(Date.now() + 1000 * 60 * 30) // 30 mins

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  })

  const link = `http://localhost:3000/reset-password?token=${token}`

  await sendEmail(email, "Reset Your Password", `<p>Click to reset password: <a href="${link}">Reset</a></p>`)

  res.status(200).json({ message: "Password reset link sent" })
}
