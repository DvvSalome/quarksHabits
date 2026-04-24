import { isSameDay, parseISO, isValid } from 'date-fns'
import HabitCard from './HabitCard'

export default function HabitTracker({ habits, onCheckIn, onEdit, onDelete }) {
  const today = new Date()

  const todayHabits = habits.filter((h) => {
    if (h.frequency === 'daily' || h.frequency === 'diaria') return true
    if (h.frequency === 'weekly' || h.frequency === 'semanal') return true
    return true
  })

  if (todayHabits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No hay hábitos configurados</p>
      </div>
    )
  }

  const completed = todayHabits.filter((h) =>
    h.checkIns?.some((c) => {
      try {
        const d = typeof c === 'string' ? parseISO(c) : new Date(c.date || c)
        return isValid(d) && isSameDay(d, today)
      } catch { return false }
    })
  ).length

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        {completed}/{todayHabits.length} completados hoy
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {todayHabits.map((habit) => (
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
