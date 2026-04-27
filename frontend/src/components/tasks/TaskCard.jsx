import { format, parseISO, isValid, isPast, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react'
import Badge from '../ui/Badge'

const priorityLabel = {
  alta: 'Alta',
  high: 'Alta',
  media: 'Media',
  medium: 'Media',
  baja: 'Baja',
  low: 'Baja',
}

function parseDate(val) {
  if (!val) return null
  try {
    const d = typeof val === 'string' ? parseISO(val) : new Date(val)
    return isValid(d) ? d : null
  } catch {
    return null
  }
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const dueDate = parseDate(task.dueDate)
  const isOverdue = dueDate && !task.completed && isPast(startOfDay(dueDate)) && !isToday(dueDate)
  const isDueToday = dueDate && !task.completed && isToday(dueDate)

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-slate-900/40 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
        task.completed
          ? 'border-cyan-900/20 opacity-50'
          : isOverdue
          ? 'border-red-500/50 bg-red-950/20'
          : 'border-cyan-900/30 hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Decorative side accent */}
      {!task.completed && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOverdue ? 'bg-red-500' : 'bg-cyan-500/50 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.8)]'} transition-all`} />
      )}

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task._id || task.id, !task.completed)}
        className={`mt-0.5 ml-2 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
          task.completed
            ? 'bg-cyan-500/20 border-cyan-500/50'
            : 'border-cyan-700 hover:border-cyan-400 hover:bg-cyan-950 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-cyan-700' : 'text-cyan-50 group-hover:glow-text transition-all'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-cyan-500/70 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.priority && (
            <Badge priority={task.priority}>
              {priorityLabel[task.priority] || task.priority}
            </Badge>
          )}
          {task.category && (
            <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
              {task.category}
            </span>
          )}
          {dueDate && (
            <span className={`flex items-center gap-1 text-[10px] font-mono tracking-wide ${
              isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-cyan-600'
            }`}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {isOverdue ? 'OVERDUE — ' : isDueToday ? 'TODAY — ' : ''}{format(dueDate, 'd MMM', { locale: es })}
            </span>
          )}
          {task.tags && task.tags.length > 0 && (
            <span className="text-[10px] text-indigo-400 font-mono tracking-wide">#{Array.isArray(task.tags) ? task.tags[0] : task.tags}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded text-cyan-600 hover:text-cyan-300 hover:bg-cyan-900/50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task._id || task.id)}
          className="p-1.5 rounded text-red-600/70 hover:text-red-400 hover:bg-red-950/50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
