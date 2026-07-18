/**
 * StudyPilot — EmailJS email service
 * ------------------------------------
 * Sends the timetable email directly from the browser — no backend server needed.
 *
 * HOW TO SET UP (one-time, free):
 * 1. Go to https://www.emailjs.com and create a free account
 * 2. Add an Email Service (Gmail recommended) → copy the Service ID
 * 3. Create an Email Template using the HTML below → copy the Template ID
 * 4. Go to Account → API Keys → copy your Public Key
 * 5. Replace the three placeholder strings below with your real values
 *
 * EMAIL TEMPLATE variables to use in EmailJS template editor:
 *   {{to_email}}      — recipient address
 *   {{subject}}       — email subject line
 *   {{html_body}}     — full HTML content (use in template as {{{html_body}}} triple braces)
 *   {{task_count}}    — number of tasks
 *   {{exam_date}}     — exam date string
 */

import emailjs from '@emailjs/browser'
import type { Task } from '@/data/mockData'

// ── ⚠️ Replace these with your real EmailJS credentials ─────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID'   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'   // e.g. 'abcDEFghiJKL123'
// ─────────────────────────────────────────────────────────────────────────────

const priorityColor: Record<string, string> = {
  URGENT:   '#EF4444',
  MEDIUM:   '#F59E0B',
  REVISION: '#3B82F6',
  EASY:     '#21D18B',
}

const priorityBg: Record<string, string> = {
  URGENT:   '#FEF2F2',
  MEDIUM:   '#FFFBEB',
  REVISION: '#EFF6FF',
  EASY:     '#ECFDF5',
}

function buildEmailHTML(tasks: Task[], examDate: string, studyHours: number): string {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalMinutes   = tasks.reduce((s, t) => s + t.timeMinutes, 0)
  const totalHours     = (totalMinutes / 60).toFixed(1)

  const taskRows = tasks.map((t) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:12px 16px;font-size:13px;color:#374151;">
        <strong style="color:#111827;">${t.date}</strong><br/>
        <span style="color:#6B7280;font-size:11px;">${t.dayName}</span>
      </td>
      <td style="padding:12px 16px;">
        <span style="font-size:11px;color:#6B7280;">${t.category}</span><br/>
        <strong style="font-size:14px;color:#111827;${t.completed ? 'text-decoration:line-through;color:#9CA3AF;' : ''}">${t.title}</strong><br/>
        <span style="font-size:12px;color:#6B7280;">${t.description}</span>
      </td>
      <td style="padding:12px 16px;text-align:center;">
        <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.05em;color:${priorityColor[t.priority] || '#374151'};background:${priorityBg[t.priority] || '#F9FAFB'};">${t.priority}</span>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151;white-space:nowrap;">${t.timeMinutes} min</td>
      <td style="padding:12px 16px;text-align:center;">${t.completed ? '<span style="color:#21D18B;font-size:16px;">✓</span>' : '<span style="color:#D1D5DB;font-size:16px;">○</span>'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>StudyPilot Timetable</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0B1220 0%,#162133 100%);padding:32px 40px;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td>
  <p style="margin:0;font-size:24px;font-weight:900;color:#21D18B;">📘 StudyPilot</p>
  <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Your personalized study timetable</p>
</td>
<td align="right">
  <div style="background:rgba(33,209,139,0.1);border:1px solid rgba(33,209,139,0.2);border-radius:12px;padding:12px 20px;text-align:center;">
    <div style="color:#21D18B;font-size:28px;font-weight:900;line-height:1;">${tasks.length}</div>
    <div style="color:#94A3B8;font-size:11px;margin-top:2px;">TASKS</div>
  </div>
</td>
</tr></table>
</td></tr>

<!-- Stats -->
<tr><td style="background:#F8FAFC;border-bottom:1px solid #E5E7EB;padding:20px 40px;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 16px;">
  <div style="font-size:20px;font-weight:800;color:#21D18B;">${completedCount}/${tasks.length}</div>
  <div style="font-size:11px;color:#6B7280;margin-top:2px;">Tasks Done</div>
</td>
<td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 16px;">
  <div style="font-size:20px;font-weight:800;color:#3B82F6;">${totalHours}h</div>
  <div style="font-size:11px;color:#6B7280;margin-top:2px;">Total Study</div>
</td>
<td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 16px;">
  <div style="font-size:20px;font-weight:800;color:#F59E0B;">${studyHours}h</div>
  <div style="font-size:11px;color:#6B7280;margin-top:2px;">Daily Target</div>
</td>
<td style="text-align:center;padding:0 16px;">
  <div style="font-size:14px;font-weight:700;color:#EF4444;">${examDate || 'Not set'}</div>
  <div style="font-size:11px;color:#6B7280;margin-top:2px;">Exam Date</div>
</td>
</tr></table>
</td></tr>

<!-- Table -->
<tr><td style="padding:32px 40px;">
<h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px;">📋 Full Timetable</h2>
<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
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

<!-- Footer -->
<tr><td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
  <p style="color:#9CA3AF;font-size:12px;margin:0;">Sent by <strong style="color:#21D18B;">StudyPilot</strong> · Stay consistent, stay focused 🚀</p>
  <p style="color:#D1D5DB;font-size:11px;margin:6px 0 0;">This is an automated reminder you requested from your dashboard.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export interface SendReminderResult {
  success: boolean
  error?: string
}

export async function sendTimetableEmail(
  toEmail: string,
  tasks: Task[],
  examDate: string,
  studyHours: number
): Promise<SendReminderResult> {
  if (
    EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' ||
    EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' ||
    EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
  ) {
    return {
      success: false,
      error: 'EmailJS not configured. Open src/lib/emailService.ts and fill in your Service ID, Template ID, and Public Key from emailjs.com (free account).',
    }
  }

  try {
    const htmlBody = buildEmailHTML(tasks, examDate, studyHours)

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email:   toEmail,
        subject:    `📚 Your StudyPilot Timetable — ${tasks.length} tasks · Exam: ${examDate || 'TBD'}`,
        html_body:  htmlBody,
        task_count: String(tasks.length),
        exam_date:  examDate || 'Not set',
      },
      EMAILJS_PUBLIC_KEY
    )

    return { success: true }
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'text' in err
        ? String((err as { text: unknown }).text)
        : err instanceof Error
        ? err.message
        : 'Unknown error'
    return { success: false, error: message }
  }
}
