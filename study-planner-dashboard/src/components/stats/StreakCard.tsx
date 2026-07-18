import React from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { Card } from '@/components/ui/Card'

// ISO weekday labels starting Monday (index 0 = Mon, 6 = Sun)
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface StreakCardProps {
  /**
   * Number of consecutive days (ending today) where at least one task was completed.
   */
  streakCount: number
  /**
   * Set of ISO date strings (YYYY-MM-DD) where the user completed at least one task.
   * Used to light up the correct day-circles for the current week.
   */
  activeDates: Set<string>
  delay?: number
}

/**
 * Returns the ISO date strings for Mon–Sun of the week containing `date`.
 */
function getCurrentWeekDates(date: Date): string[] {
  const day = date.getDay() // 0=Sun … 6=Sat
  // Shift so Monday = 0
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0] // YYYY-MM-DD
  })
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streakCount,
  activeDates,
  delay = 0.2,
}) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekDates = getCurrentWeekDates(today)

  return (
    <Card delay={delay} hover className="flex flex-col justify-between min-h-[170px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest">
          Study Streak
        </p>
        <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
          <Flame size={16} className="text-[#F59E0B]" />
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-2 mb-4">
        <motion.span
          key={streakCount}
          className="text-[52px] font-black leading-none text-[#F59E0B]"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {streakCount}
        </motion.span>
        <div className="pb-2">
          <p className="text-sm font-semibold text-[#F8FAFC] leading-tight">days</p>
          <p className="text-xs text-[#94A3B8]">
            {streakCount > 0 ? 'on fire 🔥' : 'start today!'}
          </p>
        </div>
      </div>

      {/* Week circles — Mon through Sun of the current week */}
      <div className="flex items-center gap-1.5">
        {weekDates.map((dateStr, i) => {
          const isCompleted = activeDates.has(dateStr)
          const isToday = dateStr === todayStr
          // Future day (not yet reached)
          const isFuture = dateStr > todayStr

          return (
            <motion.div
              key={dateStr}
              className="flex flex-col items-center gap-1 flex-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.07 * i + 0.25 }}
            >
              <div
                title={dateStr}
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
                  isCompleted
                    ? 'bg-[#F59E0B] text-[#0B1220] shadow-[0_0_10px_rgba(245,158,11,0.55)]'
                    : isToday && !isFuture
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-2 border-[#F59E0B]/60 border-dashed'
                    : isFuture
                    ? 'bg-[#1a2840] text-[#94A3B8]/40 border border-[#22304A]/50'
                    : 'bg-[#22304A] text-[#94A3B8]',
                ].join(' ')}
              >
                {WEEK_LABELS[i]}
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
