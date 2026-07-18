import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  animate?: boolean
  delay?: number
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  animate = true,
  delay = 0,
  onClick,
}) => {
  const baseClasses = cn(
    'rounded-2xl border border-[#22304A] bg-[#162133] p-6',
    hover && 'card-hover cursor-pointer',
    className
  )

  if (!animate) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', borderColor: 'rgba(59,130,246,0.4)' } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
