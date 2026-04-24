import { format } from 'date-fns'
import HabitCard from './HabitCard'

export default function HabitTracker({ habits, onCheckIn, onEdit, onDelete }) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
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
      <p className="text-xs text-gray-500 mb-4">
        {completed}/{habits.length} completados hoy
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
