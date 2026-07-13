import streamlit as st
import json, os, tempfile
from extract import extract_syllabus, extact_text_from_pdf
from planner import allocate_hours, generate_weekly_plan, clean_json_response
from pdf_export import generate_pdf, load_timetable
from remainder import send_daily_nudge

st.set_page_config(page_title="Study Pilot", page_icon="📚")
st.title(("📚 Study Pilot"))
st.caption("Stop guessing what to study, ask your agent instead")

st.header("Your study profile")

uploaded_file = st.file_uploader("Upload your syllabus pdf file", type=["pdf"])
email = st.text_input("Your email (for daily nudge)")
hours = st.slider("Daily study hours", min_value=1, max_value=8, value=4)

if st.button("🚀 Generate Plan"):
    if not uploaded_file:
        st.error("Please upload a syllabus pdf file")
        st.stop()
    
    with st.spinner("Reading your syllabus..."):
        # Save the uploaded file to a temporary file so that pdfplumber can use it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(uploaded_file.read())
            tmp_path = tmp.name

        raw_text = extact_text_from_pdf(tmp_path)
        raw_syllabus = extract_syllabus(raw_text)

        cleaned =  raw_syllabus.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        
        syllabus = json.loads(cleaned.strip())

    with st.spinner("Building your 7 days plan..."):
        allocated_hours = allocate_hours(syllabus, daily_hours=hours)
        raw_timetable = generate_weekly_plan(allocated_hours, daily_hours=hours)

        cleaned_timetable = raw_timetable.strip()
        if "```" in cleaned_timetable:
            cleaned_timetable = cleaned_timetable.split("```")[1]
            if cleaned_timetable.startswith("json"):
                cleaned_timetable = cleaned_timetable[4:]

        # find the json object
        start = cleaned_timetable.find("{")
        end = cleaned_timetable.rfind("}")
        cleaned_timetable = cleaned_timetable[start : end + 1]

        timetable_data = json.loads(cleaned_timetable)

        with open("timetable.json", "w") as f:
            json.dump(timetable_data, f, indent=2)
        
    with st.spinner("Generating the PDF...."):
        rows, summary = load_timetable("timetable.json")
        generate_pdf(rows, summary, output_path="timetable.pdf")

    st.success("✅ Plan Completed")

    st.header("📋 Your weekly Timetable")
    for day in timetable_data["timetable"]:
        st.subheader(f"Day {day['day']} - {day['date']}")
        for slot in day['slots']:
            chapters = ", ".join(slot["chapters_to_cover"])
            st.write(f"**{slot['subject']}** . {slot['duration_minutes']} min")
            st.caption(chapters)

            if slot.get("notes"):
                st.caption(f"📝 {slot['notes']}")
        st.divider()

    with open("timetable.pdf", "rb") as f:
        st.download_button(
            label = "📄 Download timetable pdf",
            data = f,
            file_name="my_study_plan.pdf",
            mime="application/pdf"
        )

    if email:
        try:
            send_daily_nudge(rows, recipient_email=email)
            st.success(f"Daily nudge sent to {email}")
        except Exception as e:
            st.warning(f"Couldn't send the email {e}")
    else:
        st.info("Please add the email to get notification")