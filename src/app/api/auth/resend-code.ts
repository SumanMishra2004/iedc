import prisma from "@/lib/prisma"
import { sendEmail } from "@/utils/mailer"
import { NextApiRequest,NextApiResponse } from "next"

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email is required" })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: "User not found" })

  const code = Math.floor(100000 + Math.random() * 900000).toString()

  await prisma.user.update({
    where: { email },
    data: { varificationCode: code },
  })

  await sendEmail(email, "Your New Verification Code", `<p>Your new code is <strong>${code}</strong></p>`)

  res.status(200).json({ message: "Verification code resent" })
}
