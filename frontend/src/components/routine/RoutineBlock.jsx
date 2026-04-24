import { Pencil, Trash2, Clock } from 'lucide-react'

export default function RoutineBlock({ block, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all duration-150 group">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-indigo-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{block.activity}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {block.startTime} — {block.endTime}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(block)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(block._id || block.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
