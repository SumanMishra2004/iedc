import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

export const sendEmail = async (to: string, subject: string, html: string) => {
  return await resend.emails.send({
    from: "Acme <onboarding@resend.dev>", // use verified domain
    to,
    subject,
    html,
  })
}
