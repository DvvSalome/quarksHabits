import { format, parseISO, isValid, isPast, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2, Calendar, AlertCircle, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '../ui/Badge'

const priorityLabel = {
  alta: 'Alta', high: 'Alta',
  media: 'Media', medium: 'Media',
  baja: 'Baja', low: 'Baja',
}

function parseDate(val) {
  if (!val) return null
  try {
    const d = typeof val === 'string' ? parseISO(val) : new Date(val)
    return isValid(d) ? d : null
  } catch { return null }
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const dueDate = parseDate(task.dueDate)
  const isOverdue = dueDate && !task.completed && isPast(startOfDay(dueDate)) && !isToday(dueDate)
  const isDueToday = dueDate && !task.completed && isToday(dueDate)

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${
        task.completed
          ? 'bg-stone-50 border-stone-100 opacity-60'
          : isOverdue
          ? 'bg-red-50 border-red-100'
          : 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task._id || task.id, !task.completed)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-stone-300 hover:border-emerald-400 bg-white'
        }`}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${
          task.completed ? 'line-through text-stone-400' : 'text-stone-800'
        }`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-stone-400 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.priority && (
            <Badge priority={task.priority}>
              {priorityLabel[task.priority] || task.priority}
            </Badge>
          )}
          {task.category && (
            <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
              {task.category}
            </span>
          )}
          {dueDate && (
            <span className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-500' : isDueToday ? 'text-amber-500' : 'text-stone-400'
            }`}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {isOverdue ? 'Vencida — ' : isDueToday ? 'Hoy — ' : ''}
              {format(dueDate, 'd MMM', { locale: es })}
            </span>
          )}
          {task.tags && (
            <span className="text-[10px] text-violet-500 font-medium">
              #{Array.isArray(task.tags) ? task.tags[0] : task.tags}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task._id || task.id)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
