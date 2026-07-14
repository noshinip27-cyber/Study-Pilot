import json
from datetime import datetime, date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from remainder import send_daily_nudge
import os


# ── Palette ────────────────────────────────────────────────────────────────
RED_BG      = colors.HexColor('#FEE2E2')
RED_ACCENT  = colors.HexColor('#DC2626')
YEL_BG      = colors.HexColor('#FEF9C3')
YEL_ACCENT  = colors.HexColor('#CA8A04')
GRN_BG      = colors.HexColor('#DCFCE7')
GRN_ACCENT  = colors.HexColor('#16A34A')

HEADER_BG   = colors.HexColor('#1E3A5F')
HEADER_FG   = colors.white
ALT_ROW     = colors.HexColor('#F8FAFC')
WHITE       = colors.white
BORDER      = colors.HexColor('#CBD5E1')
TEXT_DARK   = colors.HexColor('#1E293B')
TEXT_MID    = colors.HexColor('#475569')
TEXT_LIGHT  = colors.HexColor('#94A3B8')

PAGE_W, PAGE_H = A4                    # 595 x 842 pt
MARGIN = 20 * mm
TABLE_W = PAGE_W - 2 * MARGIN


# ── Styles ──────────────────────────────────────────────────────────────────
def make_styles():
    return {
        "title": ParagraphStyle(
            "title", fontName="Helvetica-Bold", fontSize=22,
            textColor=HEADER_BG, alignment=TA_CENTER, spaceAfter=2
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontName="Helvetica", fontSize=9,
            textColor=TEXT_MID, alignment=TA_CENTER, spaceAfter=10
        ),
        "date_cell": ParagraphStyle(
            "date_cell", fontName="Helvetica-Bold", fontSize=8,
            textColor=TEXT_DARK, leading=11
        ),
        "subject_cell": ParagraphStyle(
            "subject_cell", fontName="Helvetica-Bold", fontSize=8,
            textColor=TEXT_DARK, leading=11
        ),
        "topic_cell": ParagraphStyle(
            "topic_cell", fontName="Helvetica", fontSize=8,
            textColor=TEXT_MID, leading=12
        ),
        "min_cell": ParagraphStyle(
            "min_cell", fontName="Helvetica-Bold", fontSize=9,
            textColor=TEXT_DARK, alignment=TA_CENTER, leading=11
        ),
        "notes_cell": ParagraphStyle(
            "notes_cell", fontName="Helvetica-Oblique", fontSize=7,
            textColor=TEXT_MID, alignment=TA_CENTER, leading=11
        ),
        "col_header": ParagraphStyle(
            "col_header", fontName="Helvetica-Bold", fontSize=8,
            textColor=HEADER_FG, alignment=TA_CENTER, leading=10
        ),
        "legend_label": ParagraphStyle(
            "legend_label", fontName="Helvetica-Bold", fontSize=8,
            textColor=TEXT_DARK, leading=10
        ),
        "legend_sub": ParagraphStyle(
            "legend_sub", fontName="Helvetica", fontSize=7,
            textColor=TEXT_MID, leading=10
        ),
        "summary": ParagraphStyle(
            "summary", fontName="Helvetica", fontSize=8,
            textColor=TEXT_MID, alignment=TA_CENTER, leading=12
        ),
    }


# ── Color logic ─────────────────────────────────────────────────────────────
def get_urgency(exam_date_str):
    try:
        exam = datetime.strptime(exam_date_str, '%Y-%m-%d').date()
        days_left = (exam - date.today()).days
    except Exception:
        days_left = 999
    if days_left <= 7:
        return "red",    RED_BG,  RED_ACCENT
    if days_left <= 14:
        return "yellow", YEL_BG,  YEL_ACCENT
    return "green",  GRN_BG,  GRN_ACCENT


# ── Flatten JSON ─────────────────────────────────────────────────────────────
def load_timetable(json_path="timetable.json"):
    with open(json_path) as f:
        data = json.load(f)
    rows = []
    for day in data["timetable"]:
        for slot in day["slots"]:
            rows.append({
                "date":      day["date"],
                "subject":   slot["subject"],
                "topic":     ", ".join(slot["chapters_to_cover"]),
                "minutes":   slot["duration_minutes"],
                "notes":     slot.get("notes", ""),
                "exam_date": slot.get("exam_date", "2099-12-31"),
            })
    return rows, data.get("weekly_summary", "")


# ── Legend block ─────────────────────────────────────────────────────────────
def build_legend(S):
    items = [
        (RED_BG,  RED_ACCENT,  "Exam week",    "0 – 7 days left"),
        (YEL_BG,  YEL_ACCENT,  "Revision",     "8 – 14 days left"),
        (GRN_BG,  GRN_ACCENT,  "New chapters", "15+ days left"),
    ]
    cells = []
    for bg, accent, label, sub in items:
        cells.append(
            Table(
                [[Paragraph(f"● {label}", S["legend_label"])],
                 [Paragraph(sub, S["legend_sub"])]],
                colWidths=[45 * mm],
                style=TableStyle([
                    ("BACKGROUND",  (0,0), (-1,-1), bg),
                    ("LEFTPADDING", (0,0), (-1,-1), 6),
                    ("RIGHTPADDING",(0,0), (-1,-1), 6),
                    ("TOPPADDING",  (0,0), (-1,-1), 5),
                    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
                    ("LINEABOVE",   (0,0), (-1,0),  2, accent),
                    ("ROUNDEDCORNERS", [3]),
                ])
            )
        )

    legend_table = Table(
        [cells],
        colWidths=[TABLE_W / 3] * 3,
        style=TableStyle([
            ("LEFTPADDING",  (0,0), (-1,-1), 4),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING",   (0,0), (-1,-1), 0),
            ("BOTTOMPADDING",(0,0), (-1,-1), 0),
            ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ])
    )
    return legend_table


# ── Main timetable table ─────────────────────────────────────────────────────
def build_timetable_table(rows, S):
    # Column widths — total = TABLE_W
    # Date | Subject | Topics | Time | Notes
    col_w = [
        26 * mm,   # date
        42 * mm,   # subject
        TABLE_W - 26*mm - 42*mm - 18*mm - 20*mm,  # topics (fills remaining)
        18 * mm,   # time
        20 * mm,   # notes
    ]

    # Header row
    header = [
        Paragraph("DATE",    S["col_header"]),
        Paragraph("SUBJECT", S["col_header"]),
        Paragraph("TOPICS",  S["col_header"]),
        Paragraph("TIME",    S["col_header"]),
        Paragraph("NOTES",   S["col_header"]),
    ]

    table_data = [header]
    row_styles = []

    for i, row in enumerate(rows):
        zone, bg, accent = get_urgency(row["exam_date"])
        row_idx = i + 1   # +1 for header

        # Alternate very slightly on same-bg rows for readability
        fill = bg if i % 2 == 0 else colors.Color(
            bg.red * 0.97, bg.green * 0.97, bg.blue * 0.97
        )

        # Format date nicely: "14 Jun\nSun"
        try:
            d = datetime.strptime(row["date"], "%Y-%m-%d")
            date_str = d.strftime("%d %b\n%a")
        except Exception:
            date_str = row["date"]

        # Topic — wrap into multiple lines at commas for readability
        topic_text = row["topic"].replace(", ", "<br/>• ")
        if topic_text:
            topic_text = "• " + topic_text

        table_data.append([
            Paragraph(date_str,                     S["date_cell"]),
            Paragraph(row["subject"],               S["subject_cell"]),
            Paragraph(topic_text,                   S["topic_cell"]),
            Paragraph(f"{row['minutes']}<br/>min",  S["min_cell"]),
            Paragraph(row["notes"] or "—",          S["notes_cell"]),
        ])

        row_styles += [
            ("BACKGROUND",    (0, row_idx), (-1, row_idx), fill),
            ("LINEABOVE",     (0, row_idx), (-1, row_idx), 0.5, BORDER),
            ("LEFTPADDING",   (0, row_idx), (0, row_idx),  8),    # date indent
            ("TEXTCOLOR",     (0, row_idx), (0, row_idx),  accent),  # date accent color
        ]

    base_style = TableStyle([
        # Header
        ("BACKGROUND",    (0,0), (-1,0),  HEADER_BG),
        ("TOPPADDING",    (0,0), (-1,0),  7),
        ("BOTTOMPADDING", (0,0), (-1,0),  7),
        ("LINEBELOW",     (0,0), (-1,0),  2, colors.HexColor("#F59E0B")),
        # All cells
        ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("TOPPADDING",    (0,1), (-1,-1), 6),
        ("BOTTOMPADDING", (0,1), (-1,-1), 6),
        # Outer border
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("INNERGRID",     (0,1), (-1,-1), 0.3, BORDER),
    ])

    for s in row_styles:
        base_style.add(*s)

    return Table(table_data, colWidths=col_w, repeatRows=1,
                 style=base_style, hAlign="LEFT")


# ── PDF entry point ──────────────────────────────────────────────────────────
def generate_pdf(rows, summary="", output_path="timetable.pdf"):
    S = make_styles()

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title="StudyPilot — Weekly Timetable",
    )

    generated_on = date.today().strftime("%d %B %Y")
    total_slots  = len(rows)
    total_mins   = sum(r["minutes"] for r in rows)

    story = [
        Paragraph("StudyPilot — Weekly Timetable", S["title"]),
        Spacer(1, 20),
        Paragraph(
            f"Generated {generated_on}  ·  {total_slots} sessions  ·  "
            f"{total_mins // 60}h {total_mins % 60}m total study time",
            S["subtitle"]
        ),
        HRFlowable(width=TABLE_W, thickness=1, color=BORDER, spaceAfter=6),
        build_legend(S),
        Spacer(1, 6),
        build_timetable_table(rows, S),
    ]

    if summary:
        story += [
            Spacer(1, 8),
            HRFlowable(width=TABLE_W, thickness=0.5, color=BORDER, spaceBefore=2, spaceAfter=4),
            Paragraph(summary, S["summary"]),
        ]

    doc.build(story)
    print(f"PDF saved → {output_path}")



# rows, summary = load_timetable("timetable.json")
# generate_pdf(rows, summary, output_path="my_timetable.pdf")
# send_daily_nudge(rows, recipient_email=os.getenv("RECEIVER_EMAIL"))