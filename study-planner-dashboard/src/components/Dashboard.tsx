import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, XCircle, Loader2, Mail } from 'lucide-react'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNavbar } from '@/components/layout/TopNavbar'
import { ProgressCard } from '@/components/stats/ProgressCard'
import { DaysCard } from '@/components/stats/DaysCard'
import { HighlightCard } from '@/components/stats/HighlightCard'
import { TimetableFeed } from '@/components/TimetableFeed'
import { StudyChart } from '@/components/StudyChart'
import { TaskLegend } from '@/components/TaskLegend'

import { tasks as initialTasks, studyAllocation } from '@/data/mockData'
import type { Task } from '@/data/mockData'

type FilterOption = 'All Items' | 'Urgent' | 'Medium' | 'Revision' | 'Easy'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 5
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function formatExamDate(dateStr: string): string {
  if (!dateStr) return 'Jul 22, 2026'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Toast type ────────────────────────────────────────────────────────────────

type ToastState = {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'loading'
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [studyHours, setStudyHours]     = useState(4)
  const [examDate, setExamDate]         = useState('2026-07-22')
  const [email, setEmail]               = useState('')
  const [filter, setFilter]             = useState<FilterOption>('All Items')
  const [darkMode, setDarkMode]         = useState(true)
  const [tasks, setTasks]               = useState<Task[]>(initialTasks)
  const [emailSending, setEmailSending] = useState(false)

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  })

  // Derived
  const completedCount = tasks.filter((t) => t.completed).length
  const daysLeft       = getDaysUntil(examDate)
  const todayTask      = tasks.find((t) => !t.completed) ?? tasks[0]

  // ── Toast helpers ────────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'success', duration = 4500) => {
      setToast({ visible: true, message, type })
      if (type !== 'loading') {
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
      }
    },
    []
  )

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }))
  }, [])

  // ── Task toggle ───────────────────────────────────────────────────────────────

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  // ── Email Reminder ────────────────────────────────────────────────────────────

  const handleEmailReminder = useCallback(async () => {
    // Validate email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('Please enter a valid email address in the sidebar first.', 'error')
      setSidebarOpen(true)
      return
    }

    setEmailSending(true)
    showToast('Sending your timetable…', 'loading')

    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          tasks,
          examDate: formatExamDate(examDate),
          studyHours,
        }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      setEmailSending(false)

      if (res.ok && data.success) {
        setToast({ visible: false, message: '', type: 'success' })
        setTimeout(() => {
          showToast(`Email sent to ${email.trim()} ✓`, 'success', 5000)
        }, 100)
      } else {
        throw new Error(data.error ?? 'Server error — check that the email server is running.')
      }
    } catch (err) {
      setEmailSending(false)
      setToast({ visible: false, message: '', type: 'error' })
      const msg = err instanceof Error ? err.message : 'Failed to send email.'
      setTimeout(() => {
        showToast(msg, 'error', 7000)
      }, 100)
    }
  }, [email, tasks, examDate, studyHours, showToast, hideToast])

  // ── Sidebar auto-close on desktop resize ─────────────────────────────────────

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B1220] font-sans flex">

      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        studyHours={studyHours}
        onStudyHoursChange={setStudyHours}
        examDate={examDate}
        onExamDateChange={setExamDate}
        email={email}
        onEmailChange={setEmail}
        onGenerate={() => setSidebarOpen(false)}
      />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[300px]">

        {/* ── Top Navbar ── */}
        <TopNavbar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          activeFilter={filter}
          onFilterChange={setFilter}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((v) => !v)}
          onEmailReminder={handleEmailReminder}
          emailSending={emailSending}
        />

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8" role="main">

          {/* ── Page heading ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-[#21D18B]" />
              <span className="text-xs font-semibold text-[#21D18B] uppercase tracking-widest">
                AI Generated
              </span>
            </div>
            <h1 className="text-3xl sm:text-[36px] font-black text-[#F8FAFC] leading-tight tracking-tight">
              Your Personalized{' '}
              <span className="text-gradient-green">Study Plan</span>
            </h1>
            <p className="text-[#94A3B8] text-sm mt-2 max-w-xl">
              Customized plan optimized for your syllabus, exam dates, and study capacity.
            </p>
          </motion.div>

          {/* ── Stats row — 3 cards (streak removed) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <ProgressCard
              completed={completedCount}
              total={tasks.length}
              delay={0}
            />
            <DaysCard
              daysLeft={daysLeft}
              examDate={formatExamDate(examDate)}
              delay={0.1}
            />
            <HighlightCard
              title={todayTask.title}
              category={todayTask.category}
              minutes={todayTask.timeMinutes}
              delay={0.2}
            />
          </div>

          {/* ── Timetable Feed ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <TimetableFeed
              tasks={tasks}
              filter={filter}
              onToggleTask={handleToggleTask}
            />
          </motion.div>

          {/* ── Bottom two-column section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-8">
            <StudyChart data={studyAllocation} delay={0.35} />
            <TaskLegend tasks={tasks} delay={0.45} />
          </div>
        </main>
      </div>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.55)] border max-w-sm"
            style={{
              background:
                toast.type === 'error'   ? 'rgba(15,20,35,0.97)' :
                toast.type === 'loading' ? 'rgba(15,20,35,0.97)' :
                                           'rgba(15,20,35,0.97)',
              borderColor:
                toast.type === 'error'   ? 'rgba(239,68,68,0.4)'   :
                toast.type === 'loading' ? 'rgba(59,130,246,0.4)'  :
                                           'rgba(33,209,139,0.4)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            role="alert"
            aria-live="polite"
          >
            {toast.type === 'loading' && (
              <Loader2 size={17} className="text-[#3B82F6] shrink-0 animate-spin" />
            )}
            {toast.type === 'success' && (
              <div className="w-7 h-7 rounded-full bg-[#21D18B]/15 border border-[#21D18B]/30 flex items-center justify-center shrink-0">
                <Mail size={14} className="text-[#21D18B]" />
              </div>
            )}
            {toast.type === 'error' && (
              <XCircle size={17} className="text-[#EF4444] shrink-0" />
            )}
            <div>
              {toast.type === 'success' && (
                <p className="text-[11px] font-semibold text-[#21D18B] uppercase tracking-wider mb-0.5">
                  Email Sent
                </p>
              )}
              <span
                className="text-sm font-medium leading-snug"
                style={{
                  color:
                    toast.type === 'error'   ? '#FCA5A5' :
                    toast.type === 'loading' ? '#93C5FD' :
                                               '#D1FAE5',
                }}
              >
                {toast.message}
              </span>
            </div>
            {toast.type !== 'loading' && (
              <button
                onClick={hideToast}
                className="ml-auto text-[#94A3B8] hover:text-[#F8FAFC] transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <XCircle size={15} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
