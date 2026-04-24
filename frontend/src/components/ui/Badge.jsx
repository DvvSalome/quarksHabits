const priorityColors = {
  alta: 'bg-red-50 text-red-600 border border-red-100',
  high: 'bg-red-50 text-red-600 border border-red-100',
  media: 'bg-amber-50 text-amber-600 border border-amber-100',
  medium: 'bg-amber-50 text-amber-600 border border-amber-100',
  baja: 'bg-green-50 text-green-600 border border-green-100',
  low: 'bg-green-50 text-green-600 border border-green-100',
}

const frequencyColors = {
  daily: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  diaria: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  weekly: 'bg-purple-50 text-purple-600 border border-purple-100',
  semanal: 'bg-purple-50 text-purple-600 border border-purple-100',
}

const defaultColors = {
  gray: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  green: 'bg-green-50 text-green-600 border border-green-100',
  red: 'bg-red-50 text-red-600 border border-red-100',
  amber: 'bg-amber-50 text-amber-600 border border-amber-100',
  purple: 'bg-purple-50 text-purple-600 border border-purple-100',
}

export default function Badge({ children, priority, frequency, color, className = '' }) {
  let colorClass = 'bg-gray-100 text-gray-600'

  if (priority) colorClass = priorityColors[priority] || colorClass
  else if (frequency) colorClass = frequencyColors[frequency] || colorClass
  else if (color) colorClass = defaultColors[color] || colorClass

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {children}
    </span>
  )
}
