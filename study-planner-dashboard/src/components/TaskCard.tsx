import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Circle, CheckCircle2 } from 'lucide-react'
import { type Priority } from '@/data/mockData'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  id: string
  category: string
  title: string
  description: string
  priority: Priority
  timeMinutes: number
  date: string
  dayName: string
  completed: boolean
  index: number
  onToggle: (id: string) => void
}

const priorityConfig: Record<Priority, {
  label: string
  stripClass: string
  badgeClass: string
  badgeBg: string
}> = {
  URGENT: {
    label: 'URGENT',
    stripClass: 'bg-gradient-to-b from-[#EF4444] to-[#dc2626]',
    badgeClass: 'text-[#EF4444]',
    badgeBg: 'bg-[#EF4444]/10 border-[#EF4444]/25',
  },
  MEDIUM: {
    label: 'MEDIUM',
    stripClass: 'bg-gradient-to-b from-[#F59E0B] to-[#d97706]',
    badgeClass: 'text-[#F59E0B]',
    badgeBg: 'bg-[#F59E0B]/10 border-[#F59E0B]/25',
  },
  REVISION: {
    label: 'REVISION',
    stripClass: 'bg-gradient-to-b from-[#3B82F6] to-[#2563eb]',
    badgeClass: 'text-[#3B82F6]',
    badgeBg: 'bg-[#3B82F6]/10 border-[#3B82F6]/25',
  },
  EASY: {
    label: 'EASY',
    stripClass: 'bg-gradient-to-b from-[#21D18B] to-[#1aaa70]',
    badgeClass: 'text-[#21D18B]',
    badgeBg: 'bg-[#21D18B]/10 border-[#21D18B]/25',
  },
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  category,
  title,
  description,
  priority,
  timeMinutes,
  date,
  dayName,
  completed,
  index,
  onToggle,
}) => {
  const [hovered, setHovered] = useState(false)
  const config = priorityConfig[priority]

  return (
    <motion.article
      className={cn(
        'relative flex items-stretch rounded-2xl border overflow-hidden',
        'bg-[#162133] transition-all duration-200',
        completed
          ? 'border-[#22304A] opacity-60'
          : hovered
          ? 'border-[#3B82F6]/50 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.15)]'
          : 'border-[#22304A]',
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      aria-label={`Task: ${title}`}
    >
      {/* Priority strip */}
      <div className={cn('w-1.5 shrink-0', config.stripClass)} aria-hidden="true" />

      {/* Content */}
      <div className="flex items-center gap-4 flex-1 px-4 py-4">

        {/* Checkbox + Date */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-12">
          <button
            onClick={() => onToggle(id)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21D18B] rounded-full"
            aria-label={completed ? `Mark ${title} as incomplete` : `Mark ${title} as complete`}
          >
            <motion.span whileTap={{ scale: 0.85 }} className="block">
              {completed ? (
                <CheckCircle2 size={22} className="text-[#21D18B]" />
              ) : (
                <Circle size={22} className="text-[#22304A] hover:text-[#94A3B8] transition-colors" />
              )}
            </motion.span>
          </button>

          <div className="text-center">
            <p className="text-[11px] font-bold text-[#F8FAFC] leading-none">{date.split(' ')[1]}</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">{date.split(' ')[0]}</p>
            <p className="text-[10px] text-[#94A3B8]/60">{dayName}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-14 bg-[#22304A] shrink-0" aria-hidden="true" />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-[#94A3B8] font-medium">{category}</span>
          </div>
          <h3 className={cn(
            'text-[15px] font-bold text-[#F8FAFC] leading-tight mb-1.5 truncate',
            completed && 'line-through text-[#94A3B8]'
          )}>
            {title}
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {/* Right side: priority + time */}
        <div className="flex flex-col items-end gap-2.5 shrink-0 pl-2">
          <span className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded-lg border tracking-wider',
            config.badgeClass,
            config.badgeBg
          )}>
            {config.label}
          </span>
          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <Clock size={12} />
            <span className="text-xs font-semibold">{timeMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Hover glow overlay */}
      {hovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, transparent 60%)',
          }}
        />
      )}
    </motion.article>
  )
}
