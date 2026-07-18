import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Download,
  Bell,
  RefreshCw,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  Filter,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FilterOption = 'All Items' | 'Urgent' | 'Medium' | 'Revision' | 'Easy'

interface TopNavbarProps {
  onToggleSidebar: () => void
  activeFilter: FilterOption
  onFilterChange: (f: FilterOption) => void
  darkMode: boolean
  onToggleTheme: () => void
  onEmailReminder: () => void
  emailSending?: boolean
}

const filterOptions: FilterOption[] = ['All Items', 'Urgent', 'Medium', 'Revision', 'Easy']

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  activeFilter,
  onFilterChange,
  darkMode,
  onToggleTheme,
  onEmailReminder,
  emailSending = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className="h-[64px] flex items-center justify-between px-6 border-b border-[#22304A] bg-[#101827]/80 backdrop-blur-md sticky top-0 z-20"
      role="banner"
    >
      {/* Left — mobile menu + nav buttons */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <motion.button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#162133] transition-colors mr-1"
          whileTap={{ scale: 0.92 }}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </motion.button>

        {/* Your Plan — active */}
        <motion.button
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
            'bg-[#21D18B]/15 text-[#21D18B] border border-[#21D18B]/30',
            'hover:bg-[#21D18B]/25 hover:shadow-[0_0_12px_rgba(33,209,139,0.2)]'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          aria-label="Your Plan - active"
          aria-current="page"
        >
          <CheckCircle2 size={15} strokeWidth={2.5} />
          Your Plan
        </motion.button>

        {/* Download PDF */}
        <NavButton icon={<Download size={14} />} label="Download PDF" />

        {/* Email Reminder */}
        <motion.button
          onClick={onEmailReminder}
          disabled={emailSending}
          className={cn(
            'hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            emailSending
              ? 'bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] cursor-not-allowed'
              : 'bg-[#162133] border border-[#22304A] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#21D18B] hover:text-[#21D18B]'
          )}
          whileHover={emailSending ? {} : { scale: 1.02 }}
          whileTap={emailSending ? {} : { scale: 0.97 }}
          aria-label="Email Reminder"
        >
          {emailSending
            ? <Loader2 size={14} className="animate-spin" />
            : <Bell size={14} />
          }
          <span className="hidden lg:inline">
            {emailSending ? 'Sending…' : 'Email Reminder'}
          </span>
        </motion.button>

        {/* Redistribute Plan */}
        <NavButton icon={<RefreshCw size={14} />} label="Redistribute Plan" className="hidden md:flex" />
      </div>

      {/* Right — filter dropdown + theme toggle */}
      <div className="flex items-center gap-3">
        {/* Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium',
              'bg-[#162133] border border-[#22304A] text-[#F8FAFC]',
              'hover:border-[#3B82F6] transition-all duration-200'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label="Filter tasks"
          >
            <Filter size={14} className="text-[#94A3B8]" />
            <span className="hidden sm:inline">{activeFilter}</span>
            <ChevronDown
              size={14}
              className={cn(
                'text-[#94A3B8] transition-transform duration-200',
                dropdownOpen && 'rotate-180'
              )}
            />
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.ul
                role="listbox"
                aria-label="Filter options"
                className="absolute right-0 top-full mt-2 w-44 bg-[#162133] border border-[#22304A] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                {filterOptions.map((opt) => (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={activeFilter === opt}
                    onClick={() => { onFilterChange(opt); setDropdownOpen(false) }}
                    className={cn(
                      'flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150',
                      activeFilter === opt
                        ? 'text-[#21D18B] bg-[#21D18B]/10'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1a2840]'
                    )}
                  >
                    {opt}
                    {activeFilter === opt && (
                      <motion.div
                        layoutId="filter-check"
                        className="w-1.5 h-1.5 rounded-full bg-[#21D18B]"
                      />
                    )}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <motion.button
          onClick={onToggleTheme}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
            'bg-[#162133] border border-[#22304A] text-[#94A3B8]',
            'hover:border-[#3B82F6] hover:text-[#F8FAFC]'
          )}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={darkMode ? 'moon' : 'sun'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {darkMode ? <Moon size={16} /> : <Sun size={16} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  className?: string
  onClick?: () => void
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, className, onClick }) => (
  <motion.button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
      'bg-[#162133] border border-[#22304A] text-[#94A3B8]',
      'hover:text-[#F8FAFC] hover:border-[#3B82F6]',
      className
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    aria-label={label}
  >
    {icon}
    <span className="hidden lg:inline">{label}</span>
  </motion.button>
)
