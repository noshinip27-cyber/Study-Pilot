// ============================================================
// StudyPilot — Frontend Application Logic
// ============================================================

// ---------- Global State ----------
let appState = {
  theme: localStorage.getItem('studypilot-theme') || 'dark',
  timetable: [],
  completions: JSON.parse(localStorage.getItem('studypilot-completions')) || {},
  currentFilter: 'all',
  dailyHours: 4,
  email: '',
  pdfUploaded: false
};

let fileData = null;
let fileName = null;

// ---------- Default Timetable (fallback when server is offline) ----------
const defaultTimetable = [
  { id: "day1-slot1", day: 1, date: "2026-07-17", subject: "Software Development", chapter: "Java Basics", duration_minutes: 168, notes: "Introduction to class structure, syntax, and compilation flow.", exam_date: "2026-07-20", priority: "urgent" },
  { id: "day2-slot1", day: 2, date: "2026-07-18", subject: "Software Development", chapter: "Memory Allocation & JVM", duration_minutes: 168, notes: "Garbage collection, stack vs heap, classloaders.", exam_date: "2026-07-20", priority: "urgent" },
  { id: "day2-slot2", day: 2, date: "2026-07-18", subject: "Algorithms & Structures", chapter: "Linear Data Structures", duration_minutes: 29, notes: "Arrays, Lists, stacks, queues performance overview.", exam_date: "2026-08-08", priority: "medium" },
  { id: "day3-slot1", day: 3, date: "2026-07-19", subject: "Software Development", chapter: "OOP Principles", duration_minutes: 168, notes: "Polymorphism, inheritance, encapsulation with Java syntax.", exam_date: "2026-07-20", priority: "urgent" },
  { id: "day3-slot2", day: 3, date: "2026-07-19", subject: "Algorithms & Structures", chapter: "Time Complexity (Big-O)", duration_minutes: 29, notes: "Best, worst, average cases analysis.", exam_date: "2026-08-08", priority: "medium" },
  { id: "day3-slot3", day: 3, date: "2026-07-19", subject: "C Programming Basics", chapter: "Pointers & Structs", duration_minutes: 24, notes: "Memory addresses, dereferencing, struct layouts.", exam_date: "2026-08-13", priority: "easy" },
  { id: "day4-slot1", day: 4, date: "2026-07-20", subject: "Software Development", chapter: "Final Exam Prep", duration_minutes: 168, notes: "Mock testing and concept consolidation.", exam_date: "2026-07-20", priority: "urgent" },
  { id: "day4-slot2", day: 4, date: "2026-07-20", subject: "Algorithms & Structures", chapter: "Recursion", duration_minutes: 29, notes: "Call stack analysis, base cases, factorial & fibonacci.", exam_date: "2026-08-08", priority: "medium" },
  { id: "day4-slot3", day: 4, date: "2026-07-20", subject: "Web Development basics", chapter: "HTML Semantics", duration_minutes: 22, notes: "Tags, layout outline, attributes, head declarations.", exam_date: "2026-08-15", priority: "easy" },
  { id: "day5-slot1", day: 5, date: "2026-07-21", subject: "Algorithms & Structures", chapter: "Binary Trees & BSTs", duration_minutes: 168, notes: "Insertion, deletion, traversal techniques (In/Pre/Post).", exam_date: "2026-08-08", priority: "medium" },
  { id: "day5-slot2", day: 5, date: "2026-07-21", subject: "AI Job Agents", chapter: "Prompt Engineering Basics", duration_minutes: 20, notes: "Zero-shot, few-shot, system prompts optimization.", exam_date: "2026-08-19", priority: "revision" },
  { id: "day6-slot1", day: 6, date: "2026-07-22", subject: "Algorithms & Structures", chapter: "Graphs: BFS & DFS", duration_minutes: 168, notes: "Matrix/List representations, queue vs stack structures.", exam_date: "2026-08-08", priority: "medium" },
  { id: "day6-slot2", day: 6, date: "2026-07-22", subject: "RupeeRadar FinTech", chapter: "API Integration", duration_minutes: 20, notes: "Connecting transaction fetch feeds.", exam_date: "2026-08-20", priority: "easy" },
  { id: "day7-slot1", day: 7, date: "2026-07-23", subject: "Algorithms & Structures", chapter: "Dynamic Programming", duration_minutes: 168, notes: "Memoization vs Tabulation, knapsack problem.", exam_date: "2026-08-08", priority: "medium" },
  { id: "day7-slot2", day: 7, date: "2026-07-23", subject: "Software Development", chapter: "Java Revision Session", duration_minutes: 30, notes: "Weekly review of inheritance and exception handling.", exam_date: "2026-07-20", priority: "revision" }
];

// ============================================================
// API BASE URL — resolves correctly whether running standalone
// (port 8543) or embedded inside Streamlit iframe (port 8501)
// ============================================================
const API_BASE = window.location.port === '8543' ? '' : 'http://localhost:8543';

document.addEventListener('DOMContentLoaded', () => {
  // Clear stale completions from previous session
  localStorage.removeItem('studypilot-completions');
  appState.completions = {};

  initTheme();
  setupEventListeners();
  loadInitialData();
});

function initTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  updateThemeIcon();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  // Study hours slider
  const slider = document.getElementById('study-hours');
  const display = document.getElementById('hours-display');
  slider.addEventListener('input', (e) => {
    appState.dailyHours = e.target.value;
    display.textContent = `${e.target.value} hrs`;
  });

  // File upload — drag & drop
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }, false);
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); }, false);
  });
  dropZone.addEventListener('drop', handleFileDrop);

  // Generate plan
  document.getElementById('study-profile-form').addEventListener('submit', generateStudyPlan);

  // Toolbar buttons
  document.getElementById('btn-your-plan').addEventListener('click', (e) => {
    setActiveNavBtn(e.currentTarget);
    showToast('Viewing your active personalized study plan.');
  });

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    showToast('Downloading study_timetable_export.pdf...');
    window.location.href = `${API_BASE}/api/download`;
  });

  document.getElementById('btn-email-nudge').addEventListener('click', async () => {
    const emailInput = document.getElementById('user-email');
    const email = (emailInput && emailInput.value.trim()) || appState.email;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('⚠ Please enter a valid email address first.');
      if (emailInput) emailInput.focus();
      return;
    }

    const btn = document.getElementById('btn-email-nudge');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Sending…';
    btn.disabled = true;

    // Use absolute URL to the HTTP API server (port 8543), not the Streamlit iframe port

    try {
      // 60-second timeout — SMTP handshake can be slow on first connect
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${API_BASE}/api/email-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        btn.innerHTML = '<span class="btn-icon">✅</span> Sent!';
        btn.style.color = 'var(--accent, #21D18B)';
        showToast(`✅ Timetable PDF sent to ${email}`);
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.color = '';
          btn.disabled = false;
        }, 4000);
      } else {
        throw new Error(data.error || `Server error ${res.status}`);
      }
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'Timed out — email server may be slow, check your terminal.'
        : err.message;
      showToast(`✗ ${msg}`);
      btn.innerHTML = originalHTML;
      btn.style.color = '';
      btn.disabled = false;
    }
  });

  document.getElementById('btn-redistribute').addEventListener('click', redistributePlan);

  // Filter dropdown
  document.getElementById('card-filter').addEventListener('change', (e) => {
    appState.currentFilter = e.target.value;
    renderTimetable();
  });
}

// ============================================================
// PANEL VISIBILITY — right panel + topbar only after plan generated
// ============================================================

function showDashboard() {
  document.body.classList.remove('before-plan');
  document.body.classList.add('plan-ready');
}

function hideDashboard() {
  document.body.classList.remove('plan-ready');
  document.body.classList.add('before-plan');
}

// ============================================================
// FILE UPLOAD
// ============================================================

function handleFileSelect(e) {
  if (e.target.files.length > 0) processUploadedFile(e.target.files[0]);
}

function handleFileDrop(e) {
  if (e.dataTransfer.files.length > 0) processUploadedFile(e.dataTransfer.files[0]);
}

function processUploadedFile(file) {
  if (file.type !== 'application/pdf') {
    showToast('Error: Please upload a valid PDF syllabus document.');
    return;
  }

  fileName = file.name;
  const reader = new FileReader();
  reader.onload = function (e) {
    fileData = e.target.result.split(',')[1]; // base64

    const statusText = document.getElementById('upload-status-text');
    statusText.textContent = `✓ ${file.name}`;
    statusText.style.color = 'var(--accent)';

    // Just mark as ready — dashboard reveals only after Generate Plan
    appState.pdfUploaded = true;
    showToast(`Syllabus loaded: ${file.name} — click Generate Study Plan`);
  };
  reader.readAsDataURL(file);
}

// ============================================================
// DATA LOADING
// ============================================================

function mapTimetableData(apiData) {
  // Handle both flat array and nested {day, slots[]} format
  if (!Array.isArray(apiData)) return [];

  // Check if it's already flat (has "chapter" key)
  if (apiData.length > 0 && apiData[0].chapter) return apiData;

  // Nested format from API
  const flattened = [];
  apiData.forEach(dayInfo => {
    if (!dayInfo.slots) return;
    dayInfo.slots.forEach((slot, idx) => {
      let priority = 'easy';
      if (slot.notes && slot.notes.toLowerCase().includes('revision')) {
        priority = 'revision';
      } else {
        const today = new Date();
        const exam = new Date(slot.exam_date);
        const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
        if (diff <= 4) priority = 'urgent';
        else if (diff <= 15) priority = 'medium';
      }
      flattened.push({
        id: `${dayInfo.day}-slot-${idx}`,
        day: dayInfo.day,
        date: dayInfo.date,
        subject: slot.subject,
        chapter: slot.chapters_to_cover ? slot.chapters_to_cover.join(', ') : 'Study Block',
        duration_minutes: slot.duration_minutes,
        notes: slot.notes || '',
        exam_date: slot.exam_date,
        priority
      });
    });
  });
  return flattened;
}

async function loadInitialData() {
  // Clear any previous session data on every fresh page load
  // so the user always starts with the welcome screen
  try {
    await fetch(`${API_BASE}/api/clear`);
  } catch {
    // server may not be ready yet — that's fine
  }
  // Always start on the welcome screen — never auto-restore old plan
  hideDashboard();
}

// ============================================================
// THEME
// ============================================================

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('studypilot-theme', appState.theme);
  updateThemeIcon();
  renderWeeklyChart(); // re-render chart with correct gradient
}

function updateThemeIcon() {
  const sun = document.querySelector('.sun-icon');
  const moon = document.querySelector('.moon-icon');
  if (appState.theme === 'dark') {
    sun.classList.add('hidden');
    moon.classList.remove('hidden');
  } else {
    sun.classList.remove('hidden');
    moon.classList.add('hidden');
  }
}

// ============================================================
// DASHBOARD RENDERING
// ============================================================

function renderDashboard() {
  renderTimetable();
  renderWidgets();
  renderWeeklyChart();
}

// ---------- Widgets ----------

function renderWidgets() {
  const total = appState.timetable.length;
  let completed = 0;
  appState.timetable.forEach(s => { if (appState.completions[s.id]) completed++; });

  // 1. Progress Ring
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-count').textContent = `${completed} / ${total} tasks`;

  const ring = document.getElementById('progress-ring');
  const circumference = 2 * Math.PI * 23; // r=23
  ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;

  // 2. Countdown
  const today = new Date();
  let examDates = appState.timetable
    .filter(s => !appState.completions[s.id])
    .map(s => ({ date: new Date(s.exam_date), subject: s.subject }))
    .sort((a, b) => a.date - b.date);

  const daysEl = document.getElementById('countdown-days');
  const subEl = document.getElementById('countdown-subject');
  const dateEl = document.getElementById('countdown-date');

  if (examDates.length > 0) {
    const nearest = examDates[0];
    const diff = Math.max(0, Math.ceil((nearest.date - today) / (1000 * 3600 * 24)));
    daysEl.textContent = diff;
    daysEl.style.color = diff <= 3 ? 'var(--red)' : 'var(--accent)';
    subEl.textContent = nearest.subject;
    dateEl.textContent = 'Deadline: ' + nearest.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else {
    daysEl.textContent = '✓';
    daysEl.style.color = 'var(--accent)';
    subEl.textContent = 'No upcoming exams';
    dateEl.textContent = 'All finished!';
  }

  // 3. Today's Highlight
  const highlight = appState.timetable.find(s => !appState.completions[s.id]);
  const focusSub = document.getElementById('focus-subject');
  const focusMeta = document.getElementById('focus-meta');
  const focusDesc = document.getElementById('focus-desc');

  if (highlight) {
    focusSub.textContent = highlight.chapter;
    focusMeta.textContent = `${highlight.subject} · ${highlight.duration_minutes} MIN`;
    focusDesc.textContent = highlight.notes || 'Focus on key topics and examples.';
  } else {
    focusSub.textContent = 'All Caught Up!';
    focusMeta.textContent = 'NOTHING SCHEDULED';
    focusDesc.textContent = 'You have completed all study blocks.';
  }
}

// ---------- Timetable Task Cards ----------

function renderTimetable() {
  const container = document.getElementById('task-grid-container');
  container.innerHTML = '';

  const filtered = appState.timetable.filter(s => {
    const done = appState.completions[s.id] === true;
    if (appState.currentFilter === 'all') return true;
    if (appState.currentFilter === 'completed') return done;
    return s.priority === appState.currentFilter && !done;
  });

  document.getElementById('total-cards-badge').textContent = `${filtered.length} Chapters`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
        <p class="empty-title">No tasks found</p>
        <p class="empty-subtitle">Try updating your filters or checking off tasks.</p>
      </div>`;
    return;
  }

  filtered.forEach(slot => {
    const done = appState.completions[slot.id] === true;
    const card = document.createElement('div');
    card.className = `task-card card-${slot.priority} ${done ? 'completed' : ''}`;
    card.dataset.id = slot.id;

    const d = new Date(slot.date);
    const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });

    card.innerHTML = `
      <div class="card-left">
        <label class="checkbox-container" onclick="event.stopPropagation();">
          <input type="checkbox" ${done ? 'checked' : ''} onchange="toggleCardCompletion('${slot.id}')">
          <span class="checkmark"></span>
        </label>
        <div class="card-date-col">
          <span class="card-date">${monthDay}</span>
          <span class="card-day">${weekday}</span>
        </div>
      </div>
      <div class="card-center">
        <div class="card-subject">${slot.subject}</div>
        <div class="card-chapter">${slot.chapter}</div>
        <div class="card-desc">${slot.notes || ''}</div>
      </div>
      <div class="card-right">
        <span class="card-priority-badge">${slot.priority.toUpperCase()}</span>
        <span class="card-duration">${slot.duration_minutes} min</span>
      </div>`;

    card.addEventListener('click', () => toggleCardCompletion(slot.id));
    container.appendChild(card);
  });
}

// ---------- Toggle Completion ----------

function toggleCardCompletion(id) {
  appState.completions[id] = !appState.completions[id];
  localStorage.setItem('studypilot-completions', JSON.stringify(appState.completions));

  const card = document.querySelector(`.task-card[data-id="${id}"]`);
  if (card) {
    const cb = card.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = appState.completions[id];
    card.classList.toggle('completed', appState.completions[id]);
  }

  renderWidgets();
  if (appState.currentFilter !== 'all') {
    setTimeout(() => renderTimetable(), 250);
  }
}

// ---------- Weekly Bar Chart ----------

function renderWeeklyChart() {
  const barsG = document.getElementById('chart-bars');
  barsG.innerHTML = '';

  const daily = {};
  for (let i = 1; i <= 7; i++) daily[i] = 0;
  appState.timetable.forEach(s => { if (daily[s.day] !== undefined) daily[s.day] += s.duration_minutes; });

  const maxVal = Math.max(...Object.values(daily), 300);
  let x = 65;
  const barW = 50;
  const gap = 75;
  const chartH = 110;
  const baseY = 128;

  for (let day = 1; day <= 7; day++) {
    const mins = daily[day];
    const h = Math.max(6, (mins / maxVal) * chartH);
    const y = baseY - h;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barW);
    rect.setAttribute("height", h);
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", "url(#bar-gradient-dark)");
    rect.setAttribute("class", "chart-bar");
    rect.innerHTML = `<title>Day ${day}: ${mins} min</title>`;

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", x + barW / 2);
    txt.setAttribute("y", 150);
    txt.setAttribute("class", "chart-text");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent = `Day ${day}`;

    g.appendChild(rect);
    g.appendChild(txt);
    barsG.appendChild(g);

    x += gap;
  }
}

// ============================================================
// GENERATE STUDY PLAN (Backend API)
// ============================================================

async function generateStudyPlan(e) {
  e.preventDefault();

  // ── Validate: PDF must be attached ──────────────────────────
  if (!fileData) {
    // Shake the drop zone to draw attention
    const dropZone = document.getElementById('drop-zone');
    dropZone.style.borderColor = 'var(--red)';
    dropZone.style.background = 'rgba(239,68,68,0.06)';
    setTimeout(() => {
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
    }, 2500);
    showToast('⚠ Please attach a syllabus PDF first.');
    return;
  }

  const btn = document.getElementById('btn-generate-plan');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');

  appState.dailyHours = document.getElementById('study-hours').value;
  appState.email = document.getElementById('user-email').value;

  btn.disabled = true;
  btnText.textContent = 'Generating Plan...';
  spinner.classList.remove('hidden');

  // Show skeleton placeholders
  const container = document.getElementById('task-grid-container');
  container.innerHTML = `
    <div class="task-card" style="height:60px;background:var(--bg-card);opacity:0.4;border-radius:12px;"></div>
    <div class="task-card" style="height:60px;background:var(--bg-card);opacity:0.3;border-radius:12px;"></div>
    <div class="task-card" style="height:60px;background:var(--bg-card);opacity:0.2;border-radius:12px;"></div>`;

  try {
    const payload = {
      file_name: fileName,
      file_data: fileData,
      study_hours: appState.dailyHours,
      email: appState.email
    };

    const res = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.timetable) {
        appState.timetable = mapTimetableData(data.timetable);
        appState.completions = {};
        localStorage.setItem('studypilot-completions', JSON.stringify(appState.completions));
        showDashboard();
        renderDashboard();
        showToast('Study timetable generated successfully!');
      } else {
        throw new Error('Invalid response from API.');
      }
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server rejected plan compilation.');
    }
  } catch (error) {
    console.error('Generation failed:', error);
    showToast(`✗ ${error.message || 'Failed to generate plan. Please try again.'}`);
  } finally {
    btn.disabled = false;
    btnText.textContent = '🚀 Generate Study Plan';
    spinner.classList.add('hidden');
  }
}

// ============================================================
// REDISTRIBUTE PLAN (Backend API)
// ============================================================

async function redistributePlan() {
  showToast('Recalculating study allocations...');

  const cards = document.querySelectorAll('.task-card');
  cards.forEach(c => { c.style.transform = 'scale(0.98)'; c.style.opacity = '0.5'; });

  try {
    const res = await fetch(`${API_BASE}/api/redistribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ study_hours: appState.dailyHours, email: appState.email })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.timetable) {
        appState.timetable = mapTimetableData(data.timetable);
        renderDashboard();
        showToast('Timetable redistributed! Tasks balanced across available days.');
      } else throw new Error('Invalid structure');
    } else throw new Error('Backend failed redistribution');
  } catch (error) {
    console.error('Redistribution failed, shuffling locally:', error);
    setTimeout(() => {
      appState.timetable.sort(() => Math.random() - 0.5);
      const start = new Date();
      appState.timetable.forEach((s, i) => {
        const addDays = Math.floor(i / 2);
        const d = new Date(start.getTime() + addDays * 86400000);
        s.date = d.toISOString().split('T')[0];
        s.day = addDays + 1;
      });
      appState.timetable.sort((a, b) => a.day - b.day);
      renderDashboard();
      showToast('Timetable redistributed locally.');
    }, 800);
  }
}

// ============================================================
// HELPERS
// ============================================================

function setActiveNavBtn(activeBtn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-msg');
  msg.textContent = message;
  toast.classList.remove('hidden');
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3500);
}
