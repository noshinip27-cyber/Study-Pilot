import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Upload,
  Calendar,
  Clock,
  Mail,
  Rocket,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  studyHours: number
  onStudyHoursChange: (h: number) => void
  examDate: string
  onExamDateChange: (d: string) => void
  email: string
  onEmailChange: (e: string) => void
  onGenerate: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  studyHours,
  onStudyHoursChange,
  examDate,
  onExamDateChange,
  email,
  onEmailChange,
  onGenerate,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setFileName(file.name)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const sliderPercent = ((studyHours - 1) / 7) * 100

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'w-[300px] bg-[#101827] border-r border-[#22304A]',
          'overflow-y-auto overflow-x-hidden',
          // Desktop: always visible
          'lg:translate-x-0',
        )}
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        style={{ translateX: undefined }}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[#22304A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#21D18B] to-[#1aaa70] flex items-center justify-center shadow-[0_0_16px_rgba(33,209,139,0.35)]">
              <BookOpen size={18} className="text-[#0B1220]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[#F8FAFC] font-bold text-lg tracking-tight">
                StudyPilot
              </span>
              <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#21D18B]/15 text-[#21D18B] border border-[#21D18B]/30 uppercase tracking-wider">
                Beta
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">

          {/* ── Upload Syllabus ── */}
          <section aria-labelledby="upload-label">
            <div className="flex items-center gap-2 mb-3">
              <Upload size={14} className="text-[#21D18B]" />
              <span id="upload-label" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Upload Syllabus
              </span>
            </div>
            <label
              htmlFor="syllabus-upload"
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 w-full rounded-2xl',
                'border-2 border-dashed cursor-pointer transition-all duration-200 py-7 px-4',
                isDragging
                  ? 'border-[#21D18B] bg-[#21D18B]/8 shadow-[0_0_20px_rgba(33,209,139,0.15)]'
                  : 'border-[#22304A] bg-[#162133] hover:border-[#3B82F6] hover:bg-[#162133]/80'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                id="syllabus-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="sr-only"
                onChange={handleFileChange}
                aria-label="Upload syllabus file"
              />
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                isDragging ? 'bg-[#21D18B]/20' : 'bg-[#22304A]'
              )}>
                <Upload
                  size={20}
                  className={isDragging ? 'text-[#21D18B]' : 'text-[#94A3B8]'}
                />
              </div>
              {fileName ? (
                <div className="text-center">
                  <p className="text-[#21D18B] text-xs font-semibold truncate max-w-[180px]">{fileName}</p>
                  <p className="text-[#94A3B8] text-[11px] mt-0.5">File ready to upload</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[#F8FAFC] text-sm font-medium">
                    Drop your syllabus here
                  </p>
                  <p className="text-[#94A3B8] text-xs mt-1">
                    PDF, DOC, DOCX, TXT supported
                  </p>
                </div>
              )}
              {!fileName && (
                <span className="text-[11px] text-[#3B82F6] font-medium hover:underline">
                  Browse files
                </span>
              )}
            </label>
          </section>

          {/* ── Exam Date ── */}
          <section aria-labelledby="exam-date-label">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-[#3B82F6]" />
              <span id="exam-date-label" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Exam Date
              </span>
            </div>
            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
              <input
                type="date"
                value={examDate}
                onChange={(e) => onExamDateChange(e.target.value)}
                className={cn(
                  'w-full bg-[#162133] border border-[#22304A] rounded-xl',
                  'pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC]',
                  'focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40',
                  'transition-all duration-200 cursor-pointer'
                )}
                aria-labelledby="exam-date-label"
              />
            </div>
          </section>

          {/* ── Daily Study Hours ── */}
          <section aria-labelledby="study-hours-label">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#8B5CF6]" />
                <span id="study-hours-label" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                  Daily Study Hours
                </span>
              </div>
              <motion.span
                key={studyHours}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-sm font-bold text-[#21D18B] bg-[#21D18B]/10 px-2 py-0.5 rounded-lg border border-[#21D18B]/20"
              >
                {studyHours}h
              </motion.span>
            </div>

            {/* Custom slider */}
            <div className="relative pt-2 pb-4">
              <div className="relative h-2 bg-[#22304A] rounded-full">
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#21D18B] to-[#1aaa70] transition-all duration-150"
                  style={{ width: `${sliderPercent}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={studyHours}
                  onChange={(e) => onStudyHoursChange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                  aria-labelledby="study-hours-label"
                  aria-valuemin={1}
                  aria-valuemax={8}
                  aria-valuenow={studyHours}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#21D18B] shadow-[0_0_10px_rgba(33,209,139,0.5)] transition-all duration-150 pointer-events-none"
                  style={{ left: `calc(${sliderPercent}% - 10px)` }}
                />
              </div>
              <div className="flex justify-between mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <span
                    key={h}
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      studyHours === h ? 'text-[#21D18B]' : 'text-[#94A3B8]'
                    )}
                  >
                    {h}h
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Email Reminder ── */}
          <section aria-labelledby="email-label">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} className="text-[#F59E0B]" />
              <span id="email-label" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Email Reminder
              </span>
            </div>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="your@email.com"
                className={cn(
                  'w-full bg-[#162133] border border-[#22304A] rounded-xl',
                  'pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/50',
                  'focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30',
                  'transition-all duration-200'
                )}
                aria-labelledby="email-label"
              />
            </div>
          </section>
        </div>

        {/* ── CTA Button ── */}
        <div className="px-5 pb-6 pt-2 border-t border-[#22304A]">
          <motion.button
            onClick={onGenerate}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-4 rounded-xl',
              'bg-gradient-to-r from-[#21D18B] to-[#1aaa70]',
              'text-[#0B1220] font-bold text-base',
              'shadow-[0_0_24px_rgba(33,209,139,0.4)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21D18B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101827]',
              'transition-all duration-200'
            )}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 32px rgba(33,209,139,0.6)',
            }}
            whileTap={{ scale: 0.97 }}
            aria-label="Generate study plan"
          >
            <Rocket size={18} strokeWidth={2.5} />
            Generate Study Plan
            <ChevronRight size={16} strokeWidth={2.5} />
          </motion.button>
          <p className="text-center text-[11px] text-[#94A3B8]/60 mt-3">
            AI-powered plan tailored to your schedule
          </p>
        </div>
      </motion.aside>
    </>
  )
}
