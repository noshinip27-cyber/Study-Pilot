import json
import os
from datetime import date, datetime
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def load_syllabus(path="syllabus.json"):
    with open(path, "r") as f:
        return json.load(f)
    

def calculate_priority(subject, today=None):
    if today is None:
        today = date.today()

    exam_date_str = subject.get("exam_date")
    weightage_str = subject.get("weightage", "0%")

    # Parse the weightage
    try:
        weightage = float(weightage_str.find("%", "").strip())
    except:
        weightage = 10.0

    # Days remaining until the exam
    if exam_date_str:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
        days_remaining = max((exam_date - today).days, 1)
    else:
        days_remaining = 30
    
    # Priority score (higher weightage + fewer days left to the exam =  higher priority)
    priority = (weightage / days_remaining) * 100
    return priority


def allocate_hours(subjects, daily_hours=4):
    scored = []
    for subject in subjects:
        score = calculate_priority(subject)
        scored.append({
            "subject" : subject["subject"],
            "chapters" : subject.get("chapters", []),
            "exam_date" : subject.get("exam_date", "Not specified"),
            "priority_score" : score
        })
    
    scored.sort(key=lambda x: x["priority_score"], reverse=True)

    total_score = sum(s["priority_score"] for s in scored)

    # Allocate minutes proportionally
    total_daily_minutes = daily_hours * 60

    for subject in scored:
        proportion = subject["priority_score"] / total_score
        minutes = round(proportion * total_daily_minutes)
        subject["daily_minutes"] = max(minutes, 20)

    return scored


def generate_weekly_plan(allocated_subjects, daily_hours=4, days_ahead=7):
    today = date.today()

    subjects_summary = ""

    for subject in allocated_subjects:
        subjects_summary += f"""
                Subject : {subject['subject']}
                Chapters : {', '.join(subject['chapters'])}
                Exam Date : {subject['exam_date']}
                Priority Score: {subject['priority_score']}
                Daily study time : {subject['daily_minutes']} minutes
            """
        
    prompt = f"""
            You are a study planner AI.

            Today is {today.strftime('%A, %d %B %Y')}.
            The student has {daily_hours} hours to study per day.
            Create a {days_ahead}-day study timetable.

            Here are the subjects with their priority scores and daily time allocations:
            {subjects_summary}

            Rules:
            1. Higher priority subjects get more time each day.
            2. Sequence chapters logically — foundational topics before advanced ones.
            3. Include short 10-minute breaks between subjects.
            4. On days 6 and 7 (weekend), add a 30-minute revision slot for the highest priority subject.
            5. Return ONLY valid JSON — no explanation, no markdown.

            Return this exact format:
            {{
            "timetable": [
                {{
                "day": 1,
                "date": "YYYY-MM-DD",
                "slots": [
                    {{
                    "subject": "string",
                    "duration_minutes": number,
                    "chapters_to_cover": ["string"],
                    "exam_date": "YYYY-MM-DD",
                    "notes": "string"
                    }}
                ],
                "total_study_minutes": number
                }}
            ],
            "weekly_summary": "string"
            }}
            """

    response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=4000
                )
    
    return response.choices[0].message.content

def clean_json_response(raw):
    start = raw.find("{")
    end = raw.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("No JSON found")

    return raw[start:end + 1]


def display_timetable(timetable_data):
    print("\n" + "="*60)
    print("📚 YOUR STUDY TIMETABLE")
    print("="*60)

    for day in timetable_data["timetable"]:
        print(f"\n📅 Day {day['day']} — {day['date']}")
        print("-" * 40)
        for slot in day["slots"]:
            chapters = ", ".join(slot["chapters_to_cover"])
            print(f"  ⏱  {slot['duration_minutes']} min | {slot['subject']}")
            print(f"      Chapters: {chapters}")
            if slot.get("notes"):
                print(f"      Note: {slot['notes']}")
        print(f"  Total: {day['total_study_minutes']} minutes")

    print("\n" + "="*60)
    print("📝 WEEKLY SUMMARY")
    print(timetable_data.get("weekly_summary", ""))
    print("="*60 + "\n")

def main():
    print("Loading syllabus")
    subjects = load_syllabus()

    try:
        daily_hours = float(input("How many hours per day you can study? (default 4)"))
    except:
        daily_hours = 4.0

    print("Allocating study time across subjects")
    allocated = allocate_hours(subjects, daily_hours)

    print("Priority order")
    for i , subject in enumerate(allocated, 1):
        print(f" {i}. {subject['subject']} - Score: {subject['priority_score']} - {subject['daily_minutes']} min/day ")

    raw = generate_weekly_plan(allocated, daily_hours)
    cleaned = clean_json_response(raw)

    timetable_data = json.loads(cleaned)
    display_timetable(timetable_data)
    
    with open("timetable.json", "w") as f:
        json.dump(timetable_data, f, indent=2)
    
    print("saved to timetable json")


# main()



