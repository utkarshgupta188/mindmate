import express from 'express'
import nodemailer from 'nodemailer'

export const emailRouter = express.Router()

// Expect environment variables for SMTP
// SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS, SMTP_FROM
function createTransport(){
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass){
    throw new Error('SMTP configuration missing (SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

emailRouter.post('/send', async (req, res) => {
  try{
    const { to, subject, filename, pdfBase64, text } = req.body || {}
    if (!to || !pdfBase64 || !filename){
      return res.status(400).json({ error: 'Missing required fields: to, filename, pdfBase64' })
    }
    const transporter = createTransport()
    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    const info = await transporter.sendMail({
      from,
      to,
      subject: subject || 'Your MindMate Conversation Report',
      text: text || 'Attached is your conversation report PDF.',
      attachments: [{
        filename,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf'
      }]
    })
    return res.json({ ok: true, messageId: info.messageId })
  } catch (e) {
    console.error('Email send error:', e)
    return res.status(500).json({ error: 'Failed to send email' })
  }
})
