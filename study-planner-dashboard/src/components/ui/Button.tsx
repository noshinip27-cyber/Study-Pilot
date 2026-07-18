import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  glow?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#21D18B] to-[#1aaa70] text-[#0B1220] font-semibold hover:from-[#25e89a] hover:to-[#1ec080]',
  secondary:
    'bg-[#162133] border border-[#22304A] text-[#F8FAFC] hover:border-[#3B82F6] hover:bg-[#1a2840]',
  ghost:
    'bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162133]',
  outline:
    'bg-transparent border border-[#22304A] text-[#F8FAFC] hover:border-[#21D18B] hover:text-[#21D18B]',
  danger:
    'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glow = false,
  children,
  className,
  ...props
}) => {
  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21D18B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        glow && variant === 'primary' && 'shadow-[0_0_20px_rgba(33,209,139,0.4)]',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {icon && iconPosition === 'left' && (
        <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </motion.button>
  )
}
