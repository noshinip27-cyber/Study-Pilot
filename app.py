import streamlit as st
import json
import os
import tempfile
import base64
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from extract import extract_syllabus, extact_text_from_pdf
from planner import allocate_hours, generate_weekly_plan, clean_json_response
from pdf_export import generate_pdf, load_timetable
from remainder import send_daily_nudge

# CORS & Custom REST API Handler
class CustomHTTPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # API: Fetch active timetable JSON
        if self.path == '/api/timetable':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if os.path.exists('timetable.json'):
                try:
                    with open('timetable.json', 'r') as f:
                        data = json.load(f)
                    self.wfile.write(json.dumps(data).encode('utf-8'))
                except Exception as e:
                    self.wfile.write(json.dumps({"error": str(e), "timetable": []}).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({"timetable": []}).encode('utf-8'))
        
        # API: Download PDF timetable
        elif self.path.startswith('/api/download'):
            if os.path.exists('timetable.pdf'):
                self.send_response(200)
                self.send_header('Content-Type', 'application/pdf')
                self.send_header('Content-Disposition', 'attachment; filename="my_study_plan.pdf"')
                self.end_headers()
                with open('timetable.pdf', 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"PDF not generated yet. Please generate a plan first.")
        
        # Serve static assets (index.html, style.css, app.js)
        else:
            super().do_GET()

    def do_POST(self):
        # API: Generate new plan from syllabus
        if self.path == '/api/generate':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))

                file_name = data.get('file_name')
                file_base64 = data.get('file_data')
                exam_date = data.get('exam_date')
                study_hours = float(data.get('study_hours', 4))
                email = data.get('email')

                # If a new PDF is uploaded, parse it
                if file_base64:
                    file_bytes = base64.b64decode(file_base64)
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                        tmp.write(file_bytes)
                        tmp_path = tmp.name
                    
                    # Run extraction scripts
                    raw_text = extact_text_from_pdf(tmp_path)
                    raw_syllabus = extract_syllabus(raw_text)
                    
                    cleaned = raw_syllabus.strip()
                    if "```" in cleaned:
                        cleaned = cleaned.split("```")[1]
                        if cleaned.startswith("json"):
                            cleaned = cleaned[4:]
                    
                    syllabus_data = json.loads(cleaned.strip())
                    
                    # Update exam dates inside subjects where applicable
                    for subject in syllabus_data:
                        if exam_date:
                            subject["exam_date"] = exam_date

                    os.unlink(tmp_path)
                else:
                    # Fallback to existing syllabus if no new file is uploaded
                    if os.path.exists('syllabus.json'):
                        with open('syllabus.json', 'r') as f:
                            syllabus_data = json.load(f)
                    else:
                        self.send_response(400)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": "No syllabus PDF uploaded yet."}).encode('utf-8'))
                        return

                # Save syllabus.json
                with open('syllabus.json', 'w') as f:
                    json.dump(syllabus_data, f, indent=2)

                # Allocate hours based on priorities
                allocated = allocate_hours(syllabus_data, daily_hours=study_hours)
                
                # Generate study plan using Llama via Groq
                raw_timetable = generate_weekly_plan(allocated, daily_hours=study_hours)
                cleaned_timetable = clean_json_response(raw_timetable)
                timetable_data = json.loads(cleaned_timetable)

                # Save timetable.json
                with open('timetable.json', 'w') as f:
                    json.dump(timetable_data, f, indent=2)

                # Export PDF using reportlab
                rows, summary = load_timetable("timetable.json")
                generate_pdf(rows, summary, output_path="timetable.pdf")

                # Send email notification nudge via SMTP
                if email:
                    try:
                        send_daily_nudge(rows, recipient_email=email)
                    except Exception as e:
                        print(f"SMTP Error: {e}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(timetable_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                
        # API: Redistribute plan
        elif self.path == '/api/redistribute':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                study_hours = float(data.get('study_hours', 4))
                email = data.get('email')

                if os.path.exists('syllabus.json'):
                    with open('syllabus.json', 'r') as f:
                        syllabus_data = json.load(f)
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No syllabus file loaded yet."}).encode('utf-8'))
                    return

                # Allocate hours & regenerate plan
                allocated = allocate_hours(syllabus_data, daily_hours=study_hours)
                raw_timetable = generate_weekly_plan(allocated, daily_hours=study_hours)
                
                cleaned_timetable = clean_json_response(raw_timetable)
                timetable_data = json.loads(cleaned_timetable)

                with open('timetable.json', 'w') as f:
                    json.dump(timetable_data, f, indent=2)

                rows, summary = load_timetable("timetable.json")
                generate_pdf(rows, summary, output_path="timetable.pdf")

                if email:
                    try:
                        send_daily_nudge(rows, recipient_email=email)
                    except Exception as e:
                        print(f"SMTP Error: {e}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(timetable_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

# Run background HTTP server
def run_api_server():
    try:
        # Bind to localhost on port 8543
        server = HTTPServer(('localhost', 8543), CustomHTTPHandler)
        print("StudyPilot HTTP Server started on http://localhost:8543")
        server.serve_forever()
    except OSError as e:
        print(f"Port 8543 already in use: {e}. Re-using existing server instance.")

# Initialize background thread daemon
server_thread = threading.Thread(target=run_api_server)
server_thread.daemon = True
server_thread.start()

# Streamlit Page Render
st.set_page_config(
    page_title="Study Pilot", 
    page_icon="📚", 
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit standard header and margins using CSS
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding-top: 0px;
        padding-bottom: 0px;
        padding-left: 0px;
        padding-right: 0px;
    }
    iframe {
        border: none;
    }
    </style>
    """, unsafe_allow_html=True)

# Render Custom Dashboard Iframe
st.components.v1.iframe("http://localhost:8543/index.html", height=920, scrolling=True)