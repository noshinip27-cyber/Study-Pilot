import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ProgressCardProps {
  completed: number
  total: number
  delay?: number
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completed,
  total,
  delay = 0,
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const [animatedPercent, setAnimatedPercent] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPercent(percent), 400)
    return () => clearTimeout(timeout)
  }, [percent])

  // SVG ring math
  const size = 96
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference

  return (
    <Card delay={delay} hover className="flex flex-col justify-between min-h-[170px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-0.5">
            Syllabus Progress
          </p>
          <p className="text-xs text-[#94A3B8]/70">
            {completed} / {total} tasks completed
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#21D18B]/10 flex items-center justify-center border border-[#21D18B]/20">
          <CheckCircle2 size={16} className="text-[#21D18B]" />
        </div>
      </div>

      {/* Ring + value */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#22304A"
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#greenGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, delay: delay + 0.3, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#21D18B" />
                <stop offset="100%" stopColor="#1aaa70" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold text-[#F8FAFC] leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
            >
              {animatedPercent}%
            </motion.span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#21D18B]" />
            <span className="text-xs text-[#94A3B8]">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22304A]" />
            <span className="text-xs text-[#94A3B8]">Remaining</span>
          </div>
          <p className="text-xs text-[#94A3B8]/60 mt-1 leading-relaxed">
            {total - completed} tasks left to study
          </p>
        </div>
      </div>
    </Card>
  )
}
