import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import date
from dotenv import load_dotenv

load_dotenv()


def send_daily_nudge(rows, recipient_email, pdf_path=None):
    """
    Send the full timetable as a formatted HTML email with the PDF attached.

    Reads credentials from .env:
        SMTP_USER     — your Gmail address
        SMTP_PASSWORD — your 16-char Gmail App Password
    """
    sender_email = os.getenv("SMTP_USER") or os.getenv("SENDER_EMAIL") or os.getenv("GMAIL_ID")
    app_password  = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_PASSWORD")

    if not sender_email or not app_password:
        raise ValueError(
            "Email credentials not found in .env. "
            "Set SMTP_USER and SMTP_PASSWORD."
        )

    today_str = date.today().isoformat()

    # ── Priority colours ─────────────────────────────────────
    def priority_style(exam_date_str):
        try:
            from datetime import datetime
            exam = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
            days = (exam - date.today()).days
        except Exception:
            days = 999
        if days <= 7:
            return "#FEE2E2", "#DC2626"   # red bg, red text
        if days <= 14:
            return "#FEF9C3", "#CA8A04"   # yellow
        return "#DCFCE7", "#16A34A"       # green

    # ── Build table rows ─────────────────────────────────────
    task_rows = ""
    for r in rows:
        bg, color = priority_style(r.get("exam_date", "2099-12-31"))
        task_rows += f"""
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #E5E7EB;">
            <strong>{r.get('date','')}</strong>
          </td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #E5E7EB;">
            {r.get('subject','')}
          </td>
          <td style="padding:10px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E5E7EB;">
            {r.get('topic','')}
          </td>
          <td style="padding:10px 14px;text-align:center;font-weight:700;font-size:13px;border-bottom:1px solid #E5E7EB;">
            <span style="background:{bg};color:{color};padding:3px 10px;border-radius:6px;font-size:11px;">
              {r.get('minutes',0)} min
            </span>
          </td>
          <td style="padding:10px 14px;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;font-style:italic;">
            {r.get('notes','') or '—'}
          </td>
        </tr>"""

    total_mins  = sum(r.get('minutes', 0) for r in rows)
    total_hours = f"{total_mins // 60}h {total_mins % 60}m"

    # ── Full HTML email ──────────────────────────────────────
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>StudyPilot Timetable</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:680px;background:#ffffff;border-radius:16px;
         overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0B1220,#162133);padding:32px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0;font-size:22px;font-weight:900;color:#21D18B;">📘 StudyPilot</p>
        <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Your personalized study timetable</p>
      </td>
      <td align="right">
        <div style="background:rgba(33,209,139,0.12);border:1px solid rgba(33,209,139,0.25);
                    border-radius:12px;padding:12px 20px;text-align:center;display:inline-block;">
          <div style="color:#21D18B;font-size:26px;font-weight:900;line-height:1;">{len(rows)}</div>
          <div style="color:#94A3B8;font-size:11px;margin-top:3px;text-transform:uppercase;
                      letter-spacing:.05em;">Tasks</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Stats bar -->
  <tr><td style="background:#F8FAFC;border-bottom:1px solid #E5E7EB;padding:18px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 16px;">
        <div style="font-size:20px;font-weight:800;color:#3B82F6;">{total_hours}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Total Study Time</div>
      </td>
      <td style="text-align:center;border-right:1px solid #E5E7EB;padding:0 16px;">
        <div style="font-size:20px;font-weight:800;color:#21D18B;">{len(rows)}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Total Sessions</div>
      </td>
      <td style="text-align:center;padding:0 16px;">
        <div style="font-size:14px;font-weight:700;color:#F59E0B;">{today_str}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;">Generated On</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Timetable -->
  <tr><td style="padding:28px 40px;">
    <h2 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 14px;">
      📋 Full Study Timetable
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#F1F5F9;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;
                     color:#6B7280;text-transform:uppercase;">Date</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;
                     color:#6B7280;text-transform:uppercase;">Subject</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;
                     color:#6B7280;text-transform:uppercase;">Topics</th>
          <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;
                     color:#6B7280;text-transform:uppercase;">Duration</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;
                     color:#6B7280;text-transform:uppercase;">Notes</th>
        </tr>
      </thead>
      <tbody>{task_rows}</tbody>
    </table>
  </td></tr>

  <!-- PDF notice -->
  {"<tr><td style='padding:0 40px 4px;'><p style='font-size:12px;color:#6B7280;margin:0;'>📎 Your timetable PDF is attached to this email.</p></td></tr>" if pdf_path and os.path.exists(pdf_path) else ""}

  <!-- Footer -->
  <tr><td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:22px 40px;text-align:center;">
    <p style="color:#9CA3AF;font-size:12px;margin:0;">
      Sent by <strong style="color:#21D18B;">StudyPilot</strong>
      &nbsp;·&nbsp; Stay consistent, stay focused 🚀
    </p>
    <p style="color:#D1D5DB;font-size:11px;margin:6px 0 0;">
      You requested this reminder from your dashboard.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

    # ── Assemble MIME message ────────────────────────────────
    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"📚 StudyPilot — Your Full Timetable ({len(rows)} sessions · {total_hours})"
    msg["From"]    = f"StudyPilot 📘 <{sender_email}>"
    msg["To"]      = recipient_email

    msg.attach(MIMEText(html, "html"))

    # Attach PDF if it exists
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_part = MIMEApplication(f.read(), _subtype="pdf")
            pdf_part.add_header(
                "Content-Disposition",
                "attachment",
                filename="StudyPilot_Timetable.pdf"
            )
            msg.attach(pdf_part)

    # ── Send via Gmail SMTP ──────────────────────────────────
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())

    print(f"[StudyPilot] ✓ Email sent to {recipient_email}")
