import { format } from 'date-fns'
import { motion } from 'framer-motion'
import HabitCard from './HabitCard'

export default function HabitTracker({ habits, onCheckIn, onEdit, onDelete }) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <p className="text-sm">No hay hábitos configurados</p>
      </div>
    )
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const completed = habits.filter((h) =>
    (h.logs || []).some((l) => l.completed && l.date === todayStr)
  ).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-stone-500">
          <span className="font-semibold text-stone-700">{completed}</span>/{habits.length} completados hoy
        </p>
        {completed > 0 && (
          <div className="flex-1 mx-4 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / habits.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit._id || habit.id}
            habit={habit}
            onCheckIn={onCheckIn}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
