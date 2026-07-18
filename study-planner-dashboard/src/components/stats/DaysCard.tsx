import React from 'react'
import { motion } from 'framer-motion'
import { CalendarClock } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface DaysCardProps {
  daysLeft: number
  examDate: string
  delay?: number
}

export const DaysCard: React.FC<DaysCardProps> = ({ daysLeft, examDate, delay = 0.1 }) => {
  const urgency =
    daysLeft <= 3 ? 'text-[#EF4444]' :
    daysLeft <= 7 ? 'text-[#F59E0B]' :
    'text-[#3B82F6]'

  const urgencyBg =
    daysLeft <= 3 ? 'bg-[#EF4444]/10 border-[#EF4444]/20' :
    daysLeft <= 7 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20' :
    'bg-[#3B82F6]/10 border-[#3B82F6]/20'

  const urgencyIcon =
    daysLeft <= 3 ? 'text-[#EF4444]' :
    daysLeft <= 7 ? 'text-[#F59E0B]' :
    'text-[#3B82F6]'

  return (
    <Card delay={delay} hover className="flex flex-col justify-between min-h-[170px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest">
          Days To Next Exam
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${urgencyBg}`}>
          <CalendarClock size={16} className={urgencyIcon} />
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-3 mb-3">
        <motion.span
          className={`text-[56px] font-black leading-none ${urgency}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200, damping: 18 }}
        >
          {daysLeft}
        </motion.span>
        <div className="pb-2">
          <p className="text-sm font-semibold text-[#F8FAFC] leading-tight">days</p>
          <p className="text-xs text-[#94A3B8]">remaining</p>
        </div>
      </div>

      {/* Deadline label */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${urgencyBg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${urgency.replace('text-', 'bg-')}`} />
        <span className={`font-medium ${urgency}`}>
          {examDate ? `Deadline: ${examDate}` : 'No exam date set'}
        </span>
      </div>
    </Card>
  )
}
