import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Tags } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { type Task } from '@/data/mockData'

interface TaskLegendProps {
  tasks: Task[]
  delay?: number
}

const categories = [
  { key: 'URGENT',   label: 'High Priority (Urgent)', color: '#EF4444', bg: 'bg-[#EF4444]' },
  { key: 'MEDIUM',   label: 'Medium Priority',         color: '#F59E0B', bg: 'bg-[#F59E0B]' },
  { key: 'EASY',     label: 'Easy / Low Priority',     color: '#21D18B', bg: 'bg-[#21D18B]' },
  { key: 'REVISION', label: 'Revision Tasks',           color: '#3B82F6', bg: 'bg-[#3B82F6]' },
  { key: 'DONE',     label: 'Completed Tasks',          color: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
]

const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2840] border border-[#22304A] rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <p className="text-xs text-[#94A3B8] mb-1">{payload[0].name}</p>
        <p className="text-base font-bold text-[#F8FAFC]">{payload[0].value} tasks</p>
      </div>
    )
  }
  return null
}

export const TaskLegend: React.FC<TaskLegendProps> = ({ tasks, delay = 0.5 }) => {
  const counts = {
    URGENT:   tasks.filter((t) => t.priority === 'URGENT' && !t.completed).length,
    MEDIUM:   tasks.filter((t) => t.priority === 'MEDIUM' && !t.completed).length,
    EASY:     tasks.filter((t) => t.priority === 'EASY' && !t.completed).length,
    REVISION: tasks.filter((t) => t.priority === 'REVISION' && !t.completed).length,
    DONE:     tasks.filter((t) => t.completed).length,
  }

  const pieData = categories
    .map((c) => ({ name: c.label, value: counts[c.key as keyof typeof counts], color: c.color }))
    .filter((d) => d.value > 0)

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <Card delay={delay} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
          <Tags size={14} className="text-[#8B5CF6]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#F8FAFC]">Task Categories</h3>
          <p className="text-xs text-[#94A3B8]">{total} tasks across all categories</p>
        </div>
      </div>

      {/* Donut chart */}
      {pieData.length > 0 && (
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={400}
                  animationDuration={1000}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#F8FAFC]">{total}</span>
              <span className="text-[10px] text-[#94A3B8]">tasks</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend items */}
      <div className="flex flex-col gap-3">
        {categories.map((cat, i) => {
          const count = counts[cat.key as keyof typeof counts]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <motion.div
              key={cat.key}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 * i + 0.2 }}
            >
              <div className="flex items-center gap-3 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-[#94A3B8]">{cat.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="w-20 h-1.5 bg-[#22304A] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: delay + 0.15 * i + 0.3, duration: 0.6 }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-6 text-right"
                  style={{ color: cat.color }}
                >
                  {count}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
