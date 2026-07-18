import React from 'react'
import { motion } from 'framer-motion'
import { BookMarked, Clock, Tag } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface HighlightCardProps {
  title: string
  category: string
  minutes: number
  delay?: number
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  title,
  category,
  minutes,
  delay = 0.3,
}) => {
  return (
    <Card delay={delay} hover className="flex flex-col justify-between min-h-[170px] relative overflow-hidden">
      {/* Decorative glow blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#8B5CF6]/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest">
          Today's Highlight
        </p>
        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
          <BookMarked size={15} className="text-[#8B5CF6]" />
        </div>
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <Tag size={11} className="text-[#94A3B8]" />
        <span className="text-[11px] text-[#94A3B8] font-medium">{category}</span>
      </div>

      {/* Title */}
      <motion.h3
        className="text-xl font-bold text-[#F8FAFC] leading-tight mb-auto"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.2 }}
      >
        {title}
      </motion.h3>

      {/* Time pill */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg px-3 py-1.5">
          <Clock size={13} className="text-[#8B5CF6]" />
          <span className="text-sm font-bold text-[#8B5CF6]">{minutes} MIN</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#21D18B] animate-pulse" />
          <span className="text-xs text-[#94A3B8]">In progress</span>
        </div>
      </div>
    </Card>
  )
}
