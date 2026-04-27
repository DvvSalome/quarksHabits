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

  const color = habit.color && habit.color.startsWith('#') ? habit.color : '#06b6d4'
  const iconBg = hexToRgba(color, 0.15)

  const freqLabel = habit.frequency === 'daily' || habit.frequency === 'diaria' ? 'diaria' : 'semanal'

  return (
    <div className="bg-slate-900/40 border border-cyan-900/30 rounded-2xl p-5 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 group relative overflow-hidden">
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-white/10 glow-border"
            style={{ backgroundColor: iconBg, color, boxShadow: `0 0 10px ${hexToRgba(color, 0.3)}` }}
          >
            {habit.icon || '✨'}
          </div>
          <div>
            <p className="text-sm font-semibold text-cyan-50 group-hover:glow-text transition-all">{habit.name}</p>
            <Badge frequency={freqLabel} className="mt-1">
              {freqLabel === 'diaria' ? 'Daily Protocol' : 'Weekly Protocol'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 rounded-lg text-cyan-600 hover:text-cyan-300 hover:bg-cyan-900/50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(habit._id || habit.id)}
            className="p-1.5 rounded-lg text-red-600/70 hover:text-red-400 hover:bg-red-950/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 mb-4 relative z-10">
        <Flame className="w-4 h-4 text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]" />
        <span className="text-sm font-bold text-orange-300 font-mono">{habit.streak || 0}</span>
        <span className="text-[10px] text-cyan-500/60 font-mono uppercase tracking-widest">cycles streak</span>
      </div>

      {/* Mini calendar last 7 days */}
      <div className="flex gap-1 mb-4 relative z-10">
        {last7.map((day) => {
          const checked = isCheckedOn(habit, day)
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] font-mono text-cyan-600/50">{format(day, 'E', { locale: es }).slice(0, 1)}</span>
              <div
                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{ 
                  backgroundColor: checked ? hexToRgba(color, 0.2) : 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${checked ? color : 'rgba(6, 182, 212, 0.2)'}`,
                  boxShadow: checked ? `0 0 8px ${hexToRgba(color, 0.4)}` : 'none'
                }}
              >
                {checked && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Check-in button */}
      <button
        onClick={() => !isCheckedToday && onCheckIn(habit._id || habit.id, format(today, 'yyyy-MM-dd'))}
        className={`w-full py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase transition-all duration-300 relative z-10 ${
          isCheckedToday
            ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 cursor-default shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
            : 'bg-slate-800/50 text-cyan-300 hover:bg-cyan-900/40 border border-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
        }`}
      >
        {isCheckedToday ? 'PROTOCOL LOGGED' : 'INITIATE LOG'}
      </button>
    </div>
  )
}
