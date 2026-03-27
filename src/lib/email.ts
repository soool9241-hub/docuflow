import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions['attachments']
) {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments,
  })
}
