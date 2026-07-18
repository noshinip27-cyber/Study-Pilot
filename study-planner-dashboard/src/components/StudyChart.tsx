import React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { type StudyDay } from '@/data/mockData'

interface StudyChartProps {
  data: StudyDay[]
  delay?: number
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2840] border border-[#22304A] rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
        <p className="text-base font-bold text-[#21D18B]">{payload[0].value} min</p>
      </div>
    )
  }
  return null
}

export const StudyChart: React.FC<StudyChartProps> = ({ data, delay = 0.4 }) => {
  const maxMinutes = Math.max(...data.map((d) => d.minutes))
  const avgMinutes = Math.round(data.reduce((s, d) => s + d.minutes, 0) / data.length)

  return (
    <Card delay={delay} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#21D18B]/10 border border-[#21D18B]/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#21D18B]" />
            </div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Study Allocation</h3>
          </div>
          <p className="text-xs text-[#94A3B8] ml-9">Calculated daily study load (mins)</p>
        </div>
        <div className="flex items-center gap-2 bg-[#21D18B]/10 border border-[#21D18B]/20 rounded-xl px-3 py-1.5">
          <span className="text-xs text-[#94A3B8]">Avg</span>
          <span className="text-sm font-bold text-[#21D18B]">{avgMinutes}m</span>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        className="flex-1 min-h-[200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
            barCategoryGap="30%"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#21D18B" stopOpacity={1} />
                <stop offset="100%" stopColor="#1aaa70" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barGradientHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#21D18B" stopOpacity={1} />
                <stop offset="100%" stopColor="#21D18B" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#22304A"
              vertical={false}
              opacity={0.6}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}m`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 8 }}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    entry.minutes === maxMinutes
                      ? 'url(#barGradientHigh)'
                      : 'url(#barGradient)'
                  }
                  opacity={entry.minutes === maxMinutes ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Footer stats */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#22304A]">
        <div>
          <p className="text-[11px] text-[#94A3B8] mb-0.5">Peak Day</p>
          <p className="text-sm font-bold text-[#21D18B]">
            {data.find((d) => d.minutes === maxMinutes)?.day}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#94A3B8] mb-0.5">Max Load</p>
          <p className="text-sm font-bold text-[#F8FAFC]">{maxMinutes} min</p>
        </div>
        <div>
          <p className="text-[11px] text-[#94A3B8] mb-0.5">Total (7 days)</p>
          <p className="text-sm font-bold text-[#F8FAFC]">
            {data.reduce((s, d) => s + d.minutes, 0)} min
          </p>
        </div>
      </div>
    </Card>
  )
}
