import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Flame, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

function isCheckedOn(habit, date) {
  const logs = habit.logs || []
  const targetStr = format(date, 'yyyy-MM-dd')
  return logs.some((l) => l.completed && l.date === targetStr)
}

export default function HabitCard({ habit, onCheckIn, onEdit, onDelete, compact = false }) {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))
  const isCheckedToday = isCheckedOn(habit, today)

  const color = habit.color && habit.color.startsWith('#') ? habit.color : '#7c3aed'
  const freqLabel = habit.frequency === 'daily' || habit.frequency === 'diaria' ? 'Diaria' : 'Semanal'

  return (
    <div className={`bg-white border border-stone-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: color + '15' }}
          >
            {habit.icon || '✨'}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">{habit.name}</p>
            <span
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: color + '15', color }}
            >
              {freqLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(habit._id || habit.id)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 mb-3">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs font-semibold text-stone-700">{habit.streak || 0}</span>
        <span className="text-xs text-stone-400">días seguidos</span>
      </div>

      {/* Mini calendar last 7 days */}
      {!compact && (
        <div className="flex gap-1 mb-3">
          {last7.map((day, i) => {
            const checked = isCheckedOn(habit, day)
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[9px] text-stone-400 capitalize">
                  {format(day, 'EEE', { locale: es }).slice(0, 1)}
                </span>
                <div
                  className="w-full aspect-square rounded transition-all"
                  style={{
                    backgroundColor: checked ? color + '25' : '#f5f5f4',
                    border: `1.5px solid ${checked ? color : '#e7e5e4'}`,
                  }}
                >
                  {checked && (
                    <div
                      className="w-full h-full rounded flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Check-in button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => !isCheckedToday && onCheckIn(habit._id || habit.id, todayStr)}
        disabled={isCheckedToday}
        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
          isCheckedToday
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
            : 'border hover:shadow-sm active:scale-[0.98]'
        }`}
        style={
          !isCheckedToday
            ? { borderColor: color + '40', color, backgroundColor: color + '08' }
            : {}
        }
      >
        {isCheckedToday ? '✓ Completado hoy' : 'Marcar hoy'}
      </motion.button>
    </div>
  )
}
