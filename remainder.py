import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from dotenv import load_dotenv

load_dotenv()

def send_daily_nudge(rows, recipient_email):
    today = date.today().isoformat()

    today_tasks = [r for r in  rows if r['date'] == today]

    sender_email = os.getenv("GMAIL_ID")
    app_password = os.getenv("GMAIL_PASSWORD")

    table_rows = ''.join(
        f"<tr>"
        f"<td>{r['subject']}</td>"
        f"<td>{r['topic']}</td>"
        f"<td>{r['minutes']} min</td>"
        f"<td><i>{r['notes']}</i></td>"
        f"</tr>"
        for r in today_tasks
    )

    total_mins = sum(r['minutes'] for r in today_tasks)

    html = f"""
        <h2>StudyPilot — {today}</h2>
        <table border='1' cellpadding='6'>
        <tr><th>Subject</th><th>Topics</th><th>Time</th><th>Notes</th></tr>
        {table_rows}
        </table>
        <p><strong>Total today: {total_mins} minutes</strong></p>
        <p>Stay consistent. See you tomorrow.</p>
        """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'StudyPilot — Your plan for {today}'
    msg['From']    = sender_email
    msg['To']      = recipient_email
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f'Nudge sent to {recipient_email}')