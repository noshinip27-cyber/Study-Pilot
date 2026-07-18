import React from 'react'
import { motion } from 'framer-motion'
import { LayoutList } from 'lucide-react'
import { TaskCard } from '@/components/TaskCard'
import { type Task, type Priority } from '@/data/mockData'

type FilterOption = 'All Items' | 'Urgent' | 'Medium' | 'Revision' | 'Easy'

const filterMap: Record<FilterOption, Priority | null> = {
  'All Items': null,
  'Urgent': 'URGENT',
  'Medium': 'MEDIUM',
  'Revision': 'REVISION',
  'Easy': 'EASY',
}

interface TimetableFeedProps {
  tasks: Task[]
  filter: FilterOption
  onToggleTask: (id: string) => void
}

export const TimetableFeed: React.FC<TimetableFeedProps> = ({
  tasks,
  filter,
  onToggleTask,
}) => {
  const priorityFilter = filterMap[filter]
  const filtered = priorityFilter
    ? tasks.filter((t) => t.priority === priorityFilter)
    : tasks

  return (
    <section aria-labelledby="timetable-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
            <LayoutList size={15} className="text-[#3B82F6]" />
          </div>
          <div>
            <h2
              id="timetable-heading"
              className="text-base font-bold text-[#F8FAFC]"
            >
              Timetable Feed
            </h2>
            <p className="text-xs text-[#94A3B8]">Your upcoming study sessions</p>
          </div>
        </div>

        <motion.span
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#162133] border border-[#22304A] text-xs font-semibold text-[#94A3B8]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#21D18B]" />
          {filtered.length} Chapter{filtered.length !== 1 ? 's' : ''}
        </motion.span>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-[#94A3B8]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LayoutList size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No tasks match this filter</p>
          <p className="text-xs opacity-60 mt-1">Try selecting a different category</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3" role="list">
          {filtered.map((task, i) => (
            <div key={task.id} role="listitem">
              <TaskCard
                {...task}
                index={i}
                onToggle={onToggleTask}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
