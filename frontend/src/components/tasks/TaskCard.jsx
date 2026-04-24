import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2, Calendar } from 'lucide-react'
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

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition-all duration-150 group hover:shadow-sm ${
        task.completed ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task._id || task.id, !task.completed)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.completed
            ? 'bg-indigo-600 border-indigo-600'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.priority && (
            <Badge priority={task.priority}>
              {priorityLabel[task.priority] || task.priority}
            </Badge>
          )}
          {task.category && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
          )}
          {dueDate && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {format(dueDate, 'd MMM', { locale: es })}
            </span>
          )}
          {task.tags && task.tags.length > 0 && (
            <span className="text-xs text-indigo-400">#{Array.isArray(task.tags) ? task.tags[0] : task.tags}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task._id || task.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
