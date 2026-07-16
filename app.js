// Global Application State
let appState = {
  theme: localStorage.getItem('studypilot-theme') || 'light',
  timetable: [],
  completions: JSON.parse(localStorage.getItem('studypilot-completions')) || {},
  currentFilter: 'all',
  dailyHours: 4,
  examDate: '2026-07-20',
  email: 'user@domain.com'
};

// Global File Data Holder
let fileData = null;
let fileName = null;

// Initial Default fallback data (used if server is empty/offline)
const defaultTimetable = [
  {
    "id": "day1-slot1",
    "day": 1,
    "date": "2026-07-17",
    "subject": "Software Development",
    "chapter": "Java Basics",
    "duration_minutes": 168,
    "notes": "Introduction to class structure, syntax, and compilation flow.",
    "exam_date": "2026-07-20",
    "priority": "urgent"
  },
  {
    "id": "day2-slot1",
    "day": 2,
    "date": "2026-07-18",
    "subject": "Software Development",
    "chapter": "Memory Allocation & JVM",
    "duration_minutes": 168,
    "notes": "Garbage collection, stack vs heap, classloaders.",
    "exam_date": "2026-07-20",
    "priority": "urgent"
  },
  {
    "id": "day2-slot2",
    "day": 2,
    "date": "2026-07-18",
    "subject": "Algorithms & Structures",
    "chapter": "Linear Data Structures",
    "duration_minutes": 29,
    "notes": "Arrays, Lists, stacks, queues performance overview.",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day3-slot1",
    "day": 3,
    "date": "2026-07-19",
    "subject": "Software Development",
    "chapter": "OOP Principles",
    "duration_minutes": 168,
    "notes": "Polymorphism, inheritance, encapsulation with Java syntax.",
    "exam_date": "2026-07-20",
    "priority": "urgent"
  },
  {
    "id": "day3-slot2",
    "day": 3,
    "date": "2026-07-19",
    "subject": "Algorithms & Structures",
    "chapter": "Time Complexity (Big-O)",
    "duration_minutes": 29,
    "notes": "Best, worst, average cases analysis.",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day3-slot3",
    "day": 3,
    "date": "2026-07-19",
    "subject": "C Programming Basics",
    "chapter": "Pointers & Structs",
    "duration_minutes": 24,
    "notes": "Memory addresses, dereferencing, struct layouts.",
    "exam_date": "2026-08-13",
    "priority": "easy"
  },
  {
    "id": "day4-slot1",
    "day": 4,
    "date": "2026-07-20",
    "subject": "Software Development",
    "chapter": "Final Exam Prep",
    "duration_minutes": 168,
    "notes": "Mock testing and concept consolidation.",
    "exam_date": "2026-07-20",
    "priority": "urgent"
  },
  {
    "id": "day4-slot2",
    "day": 4,
    "date": "2026-07-20",
    "subject": "Algorithms & Structures",
    "chapter": "Recursion",
    "duration_minutes": 29,
    "notes": "Call stack analysis, base cases, factorial & fibonacci.",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day4-slot3",
    "day": 4,
    "date": "2026-07-20",
    "subject": "Web Development basics",
    "chapter": "HTML Semantics",
    "duration_minutes": 22,
    "notes": "Tags, layout outline, attributes, head declarations.",
    "exam_date": "2026-08-15",
    "priority": "easy"
  },
  {
    "id": "day5-slot1",
    "day": 5,
    "date": "2026-07-21",
    "subject": "Algorithms & Structures",
    "chapter": "Binary Trees & BSTs",
    "duration_minutes": 168,
    "notes": "Insertion, deletion, traversal techniques (In/Pre/Post).",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day5-slot2",
    "day": 5,
    "date": "2026-07-21",
    "subject": "AI Job Agents",
    "chapter": "Prompt Engineering Basics",
    "duration_minutes": 20,
    "notes": "Zero-shot, few-shot, system prompts optimization.",
    "exam_date": "2026-08-19",
    "priority": "revision"
  },
  {
    "id": "day6-slot1",
    "day": 6,
    "date": "2026-07-22",
    "subject": "Algorithms & Structures",
    "chapter": "Graphs: BFS & DFS",
    "duration_minutes": 168,
    "notes": "Matrix/List representations, queue vs stack structures.",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day6-slot2",
    "day": 6,
    "date": "2026-07-22",
    "subject": "RupeeRadar FinTech",
    "chapter": "API Integration",
    "duration_minutes": 20,
    "notes": "Connecting transaction fetch feeds.",
    "exam_date": "2026-08-20",
    "priority": "easy"
  },
  {
    "id": "day7-slot1",
    "day": 7,
    "date": "2026-07-23",
    "subject": "Algorithms & Structures",
    "chapter": "Dynamic Programming",
    "duration_minutes": 168,
    "notes": "Memoization vs Tabulation, knapsack problem.",
    "exam_date": "2026-08-08",
    "priority": "medium"
  },
  {
    "id": "day7-slot2",
    "day": 7,
    "date": "2026-07-23",
    "subject": "Software Development",
    "chapter": "Java Revision Session",
    "duration_minutes": 30,
    "notes": "Weekly review of inheritance and exception handling.",
    "exam_date": "2026-07-20",
    "priority": "revision"
  }
];

// Wait for DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  loadInitialData();
});

// Initialize Theme
function initTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  updateThemeIcon();
}

// Setup Interactive Action Event Listeners
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  // Form Hour Slider Interaction
  const slider = document.getElementById('study-hours');
  const sliderVal = document.getElementById('hours-display');
  slider.addEventListener('input', (e) => {
    appState.dailyHours = e.target.value;
    sliderVal.textContent = `${e.target.value} hrs`;
  });

  // Drag and Drop File Upload
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', handleFileDrop);

  // Generate Study Plan Form Submission
  document.getElementById('study-profile-form').addEventListener('submit', generateStudyPlan);

  // Toolbar Actions
  document.getElementById('btn-your-plan').addEventListener('click', (e) => {
    setActiveToolbarBtn(e.currentTarget);
    showToast('Viewing your active personalized study plan.');
  });

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    showToast('Downloading study_timetable_export.pdf...');
    window.location.href = '/api/download';
  });

  document.getElementById('btn-email-nudge').addEventListener('click', () => {
    const email = document.getElementById('user-email').value || 'your registered email';
    showToast(`Daily notification nudge scheduled to ${email}`);
  });

  document.getElementById('btn-redistribute').addEventListener('click', redistributePlan);

  // Card filter selector
  document.getElementById('card-filter').addEventListener('change', (e) => {
    appState.currentFilter = e.target.value;
    renderTimetable();
  });
}

// Flat-maps nested JSON timetable data from Python API
function mapTimetableData(apiTimetable) {
  const flattened = [];
  apiTimetable.forEach(dayInfo => {
    if (!dayInfo.slots) return;
    dayInfo.slots.forEach((slot, index) => {
      // Infer card priorities dynamically based on time remaining or title keywords
      let priority = 'easy';
      if (slot.notes && slot.notes.toLowerCase().includes('revision')) {
        priority = 'revision';
      } else {
        const today = new Date('2026-07-16'); // Hardcoded anchor to align dates
        const examDate = new Date(slot.exam_date);
        const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 4) {
          priority = 'urgent';
        } else if (diffDays <= 15) {
          priority = 'medium';
        }
      }
      
      flattened.push({
        id: `${dayInfo.day}-slot-${index}`,
        day: dayInfo.day,
        date: dayInfo.date,
        subject: slot.subject,
        chapter: slot.chapters_to_cover ? slot.chapters_to_cover.join(', ') : 'Study Block',
        duration_minutes: slot.duration_minutes,
        notes: slot.notes || '',
        exam_date: slot.exam_date,
        priority: priority
      });
    });
  });
  return flattened;
}

// Locate nearest active exam deadline
function getNearestExamDate() {
  let nearestStr = '2026-07-20';
  let minDays = Infinity;
  const today = new Date('2026-07-16');
  
  appState.timetable.forEach(slot => {
    const examDate = new Date(slot.exam_date);
    const diff = (examDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff < minDays) {
      minDays = diff;
      nearestStr = slot.exam_date;
    }
  });
  return nearestStr;
}

// Load Initial timetable data from backend
async function loadInitialData() {
  try {
    const response = await fetch('/api/timetable');
    if (response.ok) {
      const data = await response.json();
      if (data && data.timetable && data.timetable.length > 0) {
        appState.timetable = mapTimetableData(data.timetable);
        showToast('Active study plan loaded from server.');
      } else {
        appState.timetable = mapTimetableData(defaultTimetable);
      }
    } else {
      appState.timetable = mapTimetableData(defaultTimetable);
    }
  } catch (error) {
    console.error('Failed to connect to API, fallback to default study timeline:', error);
    appState.timetable = mapTimetableData(defaultTimetable);
  }

  // Bind Exam Target Date
  const examTargetStr = getNearestExamDate();
  document.getElementById('exam-date').value = examTargetStr;
  appState.examDate = examTargetStr;

  setTimeout(() => {
    renderDashboard();
  }, 800); // Visual skeletons load transition delay
}

// Toggle Theme (Light / Dark)
function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('studypilot-theme', appState.theme);
  updateThemeIcon();
  updateChartTheme();
}

function updateThemeIcon() {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (appState.theme === 'dark') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

// Drag & Drop Handlers
function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function handleFileDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function processUploadedFile(file) {
  if (file.type !== 'application/pdf') {
    showToast('Error: Please upload a valid PDF syllabus document.');
    return;
  }
  
  fileName = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    fileData = e.target.result.split(',')[1]; // Capture base64 portion
    
    const statusText = document.getElementById('upload-status-text');
    statusText.textContent = file.name;
    statusText.style.color = 'var(--accent-emerald)';
    showToast(`Syllabus loaded: ${file.name}`);
  };
  reader.readAsDataURL(file);
}

// Render Dashboard components
function renderDashboard() {
  renderTimetable();
  renderWidgets();
  renderWeeklyChart();
}

// Render widgets (Progress Ring, Countdown, Streak, Focus)
function renderWidgets() {
  const total = appState.timetable.length;
  let completed = 0;
  
  appState.timetable.forEach(slot => {
    if (appState.completions[slot.id]) {
      completed++;
    }
  });

  // 1. Progress Ring
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('progress-percentage-text').textContent = `${percentage}%`;
  document.getElementById('progress-count-text').textContent = `${completed} / ${total} tasks completed`;
  
  const circle = document.getElementById('syllabus-progress-ring');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius; // 201.06
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  // 2. Countdown Timer
  let examDates = appState.timetable
    .filter(slot => !appState.completions[slot.id])
    .map(slot => ({
      date: new Date(slot.exam_date),
      subject: slot.subject,
      rawDateStr: slot.exam_date
    }))
    .sort((a, b) => a.date - b.date);

  const countdownDaysEl = document.getElementById('countdown-days');
  const countdownSubEl = document.getElementById('countdown-subject');
  const countdownDateEl = document.getElementById('countdown-date');

  if (examDates.length > 0) {
    const nearest = examDates[0];
    const today = new Date('2026-07-16');
    
    const timeDiff = nearest.date.getTime() - today.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    countdownDaysEl.textContent = daysDiff;
    countdownDaysEl.style.color = daysDiff <= 3 ? '#EF4444' : 'var(--accent-emerald)';
    countdownSubEl.textContent = nearest.subject;
    
    const options = { month: 'short', day: 'numeric' };
    countdownDateEl.textContent = nearest.date.toLocaleDateString(undefined, options);
  } else {
    countdownDaysEl.textContent = 'Done';
    countdownDaysEl.style.color = 'var(--accent-emerald)';
    countdownSubEl.textContent = 'No upcoming exams';
    countdownDateEl.textContent = 'All exams finished!';
  }

  // 3. Streak Count
  const streakCountEl = document.getElementById('streak-count');
  const baseStreak = 5;
  const totalCompletedToday = completed;
  streakCountEl.textContent = baseStreak + (totalCompletedToday > 0 ? 1 : 0);

  const satDot = document.getElementById('streak-saturday');
  const sunDot = document.getElementById('streak-sunday');
  if (completed >= 3) {
    satDot.classList.add('active');
  } else {
    satDot.classList.remove('active');
  }
  if (completed >= 6) {
    sunDot.classList.add('active');
  } else {
    sunDot.classList.remove('active');
  }

  // 4. Today's Highlight
  const focusSubjectEl = document.getElementById('focus-subject');
  const focusMetaEl = document.getElementById('focus-meta');
  const focusDescEl = document.getElementById('focus-desc');
  
  const currentHighlight = appState.timetable.find(slot => !appState.completions[slot.id]);
  
  if (currentHighlight) {
    focusSubjectEl.textContent = currentHighlight.chapter;
    focusMetaEl.textContent = `${currentHighlight.subject} · ${currentHighlight.duration_minutes} min`;
    focusDescEl.textContent = currentHighlight.notes || 'Prioritize covering standard key topics and practicing examples.';
  } else {
    focusSubjectEl.textContent = 'All Caught Up!';
    focusMetaEl.textContent = 'Nothing Scheduled Today';
    focusDescEl.textContent = 'Fantastic! You have completed all study blocks for this plan.';
  }
}

// Render study task cards
function renderTimetable() {
  const container = document.getElementById('task-grid-container');
  container.innerHTML = '';
  
  const filtered = appState.timetable.filter(slot => {
    const isCompleted = appState.completions[slot.id] === true;
    if (appState.currentFilter === 'all') return true;
    if (appState.currentFilter === 'completed') return isCompleted;
    if (appState.currentFilter === 'urgent') return slot.priority === 'urgent' && !isCompleted;
    if (appState.currentFilter === 'medium') return slot.priority === 'medium' && !isCompleted;
    if (appState.currentFilter === 'easy') return slot.priority === 'easy' && !isCompleted;
    if (appState.currentFilter === 'revision') return slot.priority === 'revision' && !isCompleted;
    return true;
  });

  document.getElementById('total-cards-badge').textContent = `${filtered.length} Chapters`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
        <p class="empty-title">No tasks found</p>
        <p class="empty-subtitle">Try updating your filters or checking off tasks.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(slot => {
    const isCompleted = appState.completions[slot.id] === true;
    
    const card = document.createElement('div');
    card.className = `task-card card-${slot.priority} ${isCompleted ? 'completed' : ''}`;
    card.dataset.id = slot.id;

    const dateObj = new Date(slot.date);
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

    card.innerHTML = `
      <div class="card-left">
        <label class="checkbox-container" onclick="event.stopPropagation();">
          <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleCardCompletion('${slot.id}')">
          <span class="checkmark"></span>
        </label>
        <div class="card-date-col">
          <span class="card-date">${formattedDate}</span>
          <span class="card-day">${dayName}</span>
        </div>
      </div>
      <div class="card-center">
        <div class="card-subject-row">
          <span class="card-subject">${slot.subject}</span>
        </div>
        <div class="card-chapter">${slot.chapter}</div>
        <div class="card-desc">${slot.notes || ''}</div>
      </div>
      <div class="card-right">
        <span class="card-priority-badge">${slot.priority}</span>
        <span class="card-duration">${slot.duration_minutes} min</span>
      </div>
    `;

    card.addEventListener('click', () => {
      toggleCardCompletion(slot.id);
    });

    container.appendChild(card);
  });
}

// Toggle study card completion status
function toggleCardCompletion(id) {
  appState.completions[id] = !appState.completions[id];
  localStorage.setItem('studypilot-completions', JSON.stringify(appState.completions));
  
  const card = document.querySelector(`.task-card[data-id="${id}"]`);
  if (card) {
    const checked = appState.completions[id];
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = checked;
    
    if (checked) {
      card.classList.add('completed');
    } else {
      card.classList.remove('completed');
    }
  }

  renderWidgets();
  
  if (appState.currentFilter !== 'all') {
    setTimeout(() => renderTimetable(), 250);
  }
}

// Render dynamic weekly hours SVG chart
function renderWeeklyChart() {
  const chartBarsContainer = document.getElementById('chart-bars');
  chartBarsContainer.innerHTML = '';
  
  const dailyAllocation = {};
  for (let i = 1; i <= 7; i++) {
    dailyAllocation[i] = 0;
  }

  appState.timetable.forEach(slot => {
    if (dailyAllocation[slot.day] !== undefined) {
      dailyAllocation[slot.day] += slot.duration_minutes;
    }
  });

  const maxVal = Math.max(...Object.values(dailyAllocation), 300);
  
  let xOffset = 65;
  const barWidth = 30;
  const gap = 60;
  const chartHeight = 120;
  
  for (let day = 1; day <= 7; day++) {
    const minutes = dailyAllocation[day];
    const height = Math.max(8, (minutes / maxVal) * chartHeight);
    const yVal = 120 - height;
    
    const barGradientUrl = appState.theme === 'dark' ? 'url(#bar-gradient-dark)' : 'url(#bar-gradient)';

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", xOffset);
    rect.setAttribute("y", yVal);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", barGradientUrl);
    rect.setAttribute("class", "chart-bar");
    rect.innerHTML = `<title>Day ${day}: ${minutes} minutes of study</title>`;
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", xOffset + (barWidth / 2));
    text.setAttribute("y", 140);
    text.setAttribute("class", "chart-text");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `Day ${day}`;
    
    group.appendChild(rect);
    group.appendChild(text);
    chartBarsContainer.appendChild(group);
    
    xOffset += gap;
  }
}

// Update SVG gradient references when theme switches
function updateChartTheme() {
  const bars = document.querySelectorAll('.chart-bar');
  const barGradientUrl = appState.theme === 'dark' ? 'url(#bar-gradient-dark)' : 'url(#bar-gradient)';
  bars.forEach(bar => {
    bar.setAttribute('fill', barGradientUrl);
  });
}

// Connect to backend generate API
async function generateStudyPlan(e) {
  e.preventDefault();
  
  const generateBtn = document.getElementById('btn-generate-plan');
  const btnText = generateBtn.querySelector('.btn-text');
  const spinner = generateBtn.querySelector('.spinner');
  
  appState.examDate = document.getElementById('exam-date').value;
  appState.dailyHours = document.getElementById('study-hours').value;
  appState.email = document.getElementById('user-email').value;

  generateBtn.disabled = true;
  btnText.textContent = 'Generating Plan...';
  spinner.classList.remove('hidden');

  const container = document.getElementById('task-grid-container');
  container.innerHTML = `
    <div class="task-card-skeleton"></div>
    <div class="task-card-skeleton"></div>
    <div class="task-card-skeleton"></div>
  `;

  try {
    const payload = {
      file_name: fileName,
      file_data: fileData, // Base64 PDF bytes
      exam_date: appState.examDate,
      study_hours: appState.dailyHours,
      email: appState.email
    };

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.timetable) {
        appState.timetable = mapTimetableData(data.timetable);
        
        // Reset completions
        appState.completions = {};
        localStorage.setItem('studypilot-completions', JSON.stringify(appState.completions));
        
        renderDashboard();
        showToast('Plan completed. Study timetable generated successfully!');
      } else {
        throw new Error('Invalid JSON payload returned by API.');
      }
    } else {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Server rejected study plan compilation.');
    }
  } catch (error) {
    console.error('Plan generation failed. Invoking local simulation mode:', error);
    showToast(`Offline Warning: ${error.message || 'Server error. Loading simulation plan.'}`);
    
    // Simulate generation fallback
    setTimeout(() => {
      const hourFactor = appState.dailyHours / 4;
      appState.timetable = defaultTimetable.map(item => ({
        ...item,
        duration_minutes: Math.round(item.duration_minutes * hourFactor)
      }));
      renderDashboard();
    }, 1200);
  } finally {
    generateBtn.disabled = false;
    btnText.textContent = '🚀 Generate Study Plan';
    spinner.classList.add('hidden');
  }
}

// Connect to backend redistribution API
async function redistributePlan() {
  showToast('Recalculating study allocations...');
  
  const cards = document.querySelectorAll('.task-card');
  cards.forEach(card => {
    card.style.transform = 'scale(0.98)';
    card.style.opacity = '0.5';
  });

  try {
    const payload = {
      study_hours: appState.dailyHours,
      email: appState.email
    };

    const response = await fetch('/api/redistribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.timetable) {
        appState.timetable = mapTimetableData(data.timetable);
        renderDashboard();
        showToast('Timetable redistributed! Tasks balanced across available days.');
      } else {
        throw new Error('Invalid structure');
      }
    } else {
      throw new Error('Backend failed redistribution request');
    }
  } catch (error) {
    console.error('API redistribution failed. Falling back to local randomize:', error);
    
    // Local Shuffle simulation fallback
    setTimeout(() => {
      appState.timetable.sort(() => Math.random() - 0.5);
      const startDate = new Date();
      appState.timetable.forEach((slot, index) => {
        const addedDays = Math.floor(index / 2);
        const targetDate = new Date(startDate.getTime() + (addedDays * 24 * 60 * 60 * 1000));
        slot.date = targetDate.toISOString().split('T')[0];
        slot.day = addedDays + 1;
      });
      appState.timetable.sort((a, b) => a.day - b.day);
      renderDashboard();
      showToast('Timetable redistributed! Tasks shuffled locally.');
    }, 800);
  }
}

// Helper to update Active layout tab buttons
function setActiveToolbarBtn(activeBtn) {
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  activeBtn.classList.add('active');
}

// Toast component triggering helper
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  
  toastMsg.textContent = message;
  toast.classList.remove('hidden');
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }, 3500);
}
