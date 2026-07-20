/**
 * StudyPilot — Nodemailer Email Server
 * ──────────────────────────────────────
 * Express server on port 3001.
 * Vite dev server on port 5173 proxies /api/* here.
 *
 * Credentials are read from .env in the project root:
 *   EMAIL_USER=example@gmail.com
 *   EMAIL_PASS=xxxx xxxx xxxx xxxx   ← 16-char Gmail App Password
 */

import express from 'express'
import cors    from 'cors'
import nodemailer from 'nodemailer'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env')
  if (!existsSync(envPath)) {
    console.warn('[StudyPilot] WARNING: .env file not found at', envPath)
    return
  }
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) process.env[key] = val
  }
}
loadEnv()

const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

// ── Create reusable transporter ───────────────────────────────────────────────
let transporter = null

if (EMAIL_USER && EMAIL_PASS &&
    EMAIL_USER !== 'your.gmail@gmail.com' &&
    EMAIL_PASS !== 'your_16_char_app_password') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })
}

// ── Build HTML email ──────────────────────────────────────────────────────────
function buildEmailHTML(tasks, examDate, studyHours) {
  const priorityColor = { URGENT:'#EF4444', MEDIUM:'#F59E0B', REVISION:'#3B82F6', EASY:'#21D18B' }
  const priorityBg    = { URGENT:'#FEF2F2', MEDIUM:'#FFFBEB', REVISION:'#EFF6FF', EASY:'#ECFDF5' }

  const completedCount = tasks.filter(t => t.completed).length
  const totalHours     = (tasks.reduce((s, t) => s + t.timeMinutes, 0) / 60).toFixed(1)

  const taskRows = tasks.map(t => `
    <tr style="border-bottom:1px solid #E5E7EB;">
      <td style="padding:12px 16px;font-size:13px;">
        <strong style="color:#111827;">${t.date}</strong><br>
        <span style="color:#6B7280;font-size:11px;">${t.dayName}</span>
      </td>
      <td style="padding:12px 16px;">
        <span style="font-size:11px;color:#6B7280;">${t.category}</span><br>
        <strong style="font-size:14px;color:#111827;${t.completed ? 'text-decoration:line-through;opacity:0.5;' : ''}">${t.title}</strong><br>
        <span style="font-size:12px;color:#6B7280;">${t.description}</span>
      </td>
      <td style="padding:12px 16px;text-align:center;">
        <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;
          color:${priorityColor[t.priority] || '#374151'};
          background:${priorityBg[t.priority] || '#F9FAFB'};">${t.priority}</span>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151;white-space:nowrap;">
        ${t.timeMinutes} min
      </td>
      <td style="padding:12px 16px;text-align:center;font-size:16px;">
        ${t.completed ? '<span style="color:#21D18B;">✓</span>' : '<span style="color:#D1D5DB;">○</span>'}
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>StudyPilot Timetable</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#0B1220,#162133);padding:32px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0;font-size:22px;font-weight:900;color:#21D18B;">📘 StudyPilot</p>
        <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Your personalized study timetable</p>
      </td>
      <td align="right">
        <div style="background:rgba(33,209,139,0.1);border:1px solid rgba(33,209,139,0.25);border-radius:12px;padding:12px 20px;text-align:center;display:inline-block;">
          <div style="color:#21D18B;font-size:26px;font-weight:900;line-height:1;">${tasks.length}</div>
          <div style="color:#94A3B8;font-size:11px;margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">Tasks</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- STATS -->
  <tr><td style="background:#F8FAFC;border-bottom:1px solid #E5E7EB;padding:20px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 12px;">
        <div style="font-size:20px;font-weight:800;color:#21D18B;">${completedCount}/${tasks.length}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Tasks Done</div>
      </td>
      <td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 12px;">
        <div style="font-size:20px;font-weight:800;color:#3B82F6;">${totalHours}h</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Total Study</div>
      </td>
      <td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 12px;">
        <div style="font-size:20px;font-weight:800;color:#F59E0B;">${studyHours}h</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Daily Target</div>
      </td>
      <td style="text-align:center;padding:0 12px;">
        <div style="font-size:14px;font-weight:700;color:#EF4444;">${examDate || 'Not set'}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Exam Date</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- TIMETABLE -->
  <tr><td style="padding:32px 40px;">
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px;">📋 Full Timetable</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Date</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Task</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Priority</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Duration</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Done</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
    <p style="color:#9CA3AF;font-size:12px;margin:0;">
      Sent by <strong style="color:#21D18B;">StudyPilot</strong> &nbsp;·&nbsp; Stay consistent, stay focused 🚀
    </p>
    <p style="color:#D1D5DB;font-size:11px;margin:6px 0 0;">
      You requested this reminder from your dashboard.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '4mb' }))

// ── POST /api/send-reminder ───────────────────────────────────────────────────
app.post('/api/send-reminder', async (req, res) => {
  const { to, tasks, examDate, studyHours } = req.body

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'A valid recipient email address is required.' })
  }
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'No tasks found to include in the email.' })
  }
  if (!transporter) {
    return res.status(500).json({
      error: 'Email not configured. Add EMAIL_USER and EMAIL_PASS to your .env file.',
    })
  }

  try {
    const info = await transporter.sendMail({
      from:    `"StudyPilot 📘" <${EMAIL_USER}>`,
      to,
      subject: `📚 Your StudyPilot Timetable — ${tasks.length} tasks · Exam: ${examDate || 'TBD'}`,
      html:    buildEmailHTML(tasks, examDate, studyHours ?? 4),
    })

    console.log(`[StudyPilot] ✓ Email sent → ${to}  (messageId: ${info.messageId})`)
    return res.json({ success: true })
  } catch (err) {
    console.error('[StudyPilot] ✗ Send failed:', err.message)
    return res.status(500).json({ error: err.message ?? 'Failed to send email.' })
  }
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', emailConfigured: !!transporter }))

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.EMAIL_SERVER_PORT) || 3001
app.listen(PORT, () => {
  console.log('')
  console.log('  ┌─────────────────────────────────────────┐')
  console.log('  │   📘 StudyPilot Email Server             │')
  console.log(`  │   Listening on http://localhost:${PORT}    │`)
  console.log('  └─────────────────────────────────────────┘')
  console.log('')
  if (transporter) {
    console.log(`  ✓ Gmail ready — sending as ${EMAIL_USER}`)
  } else {
    console.log('  ✗ Email NOT configured.')
    console.log('    Add EMAIL_USER and EMAIL_PASS to .env')
  }
  console.log('')
})
