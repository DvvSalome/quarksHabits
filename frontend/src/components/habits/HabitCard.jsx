import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Flame, Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'

function isCheckedOn(habit, date) {
  const logs = habit.logs || []
  const targetStr = format(date, 'yyyy-MM-dd')
  return logs.some((l) => l.completed && l.date === targetStr)
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function HabitCard({ habit, onCheckIn, onEdit, onDelete }) {
  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))
  const isCheckedToday = isCheckedOn(habit, today)

  const color = habit.color && habit.color.startsWith('#') ? habit.color : '#6366f1'
  const iconBg = hexToRgba(color, 0.15)

  const freqLabel = habit.frequency === 'daily' || habit.frequency === 'diaria' ? 'diaria' : 'semanal'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all duration-150 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: iconBg, color }}
          >
            {habit.icon || '✨'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{habit.name}</p>
            <Badge frequency={freqLabel} className="mt-0.5">
              {freqLabel === 'diaria' ? 'Diaria' : 'Semanal'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(habit._id || habit.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 mb-4">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-gray-700">{habit.streak || 0}</span>
        <span className="text-xs text-gray-400">días seguidos</span>
      </div>

      {/* Mini calendar last 7 days */}
      <div className="flex gap-1 mb-4">
        {last7.map((day) => {
          const checked = isCheckedOn(habit, day)
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs text-gray-300">{format(day, 'E', { locale: es }).slice(0, 1)}</span>
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: checked ? color : '#f3f4f6' }}
              />
            </div>
          )
        })}
      </div>

      {/* Check-in button */}
      <button
        onClick={() => !isCheckedToday && onCheckIn(habit._id || habit.id, format(today, 'yyyy-MM-dd'))}
        className={`w-full py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
          isCheckedToday
            ? 'bg-green-50 text-green-600 border border-green-100 cursor-default'
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-transparent'
        }`}
      >
        {isCheckedToday ? '✓ Completado hoy' : 'Marcar como hecho'}
      </button>
    </div>
  )
}
