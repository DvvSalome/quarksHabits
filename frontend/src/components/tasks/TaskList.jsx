import TaskCard from './TaskCard'

const priorityOrder = ['alta', 'high', 'media', 'medium', 'baja', 'low']

const priorityGroupLabel = {
  alta: 'Prioridad Alta',
  high: 'Prioridad Alta',
  media: 'Prioridad Media',
  medium: 'Prioridad Media',
  baja: 'Prioridad Baja',
  low: 'Prioridad Baja',
}

function normPriority(p) {
  if (p === 'high') return 'alta'
  if (p === 'medium') return 'media'
  if (p === 'low') return 'baja'
  return p || 'media'
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete, groupByPriority = true }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-sm">No hay tareas aquí</p>
      </div>
    )
  }

  if (!groupByPriority) {
    return (
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task._id || task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  const groups = {}
  tasks.forEach((task) => {
    const p = normPriority(task.priority)
    if (!groups[p]) groups[p] = []
    groups[p].push(task)
  })

  const orderedPriorities = ['alta', 'media', 'baja'].filter((p) => groups[p]?.length > 0)

  return (
    <div className="flex flex-col gap-6">
      {orderedPriorities.map((priority) => (
        <div key={priority}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {priorityGroupLabel[priority]}
          </h4>
          <div className="flex flex-col gap-2">
            {groups[priority].map((task) => (
              <TaskCard
                key={task._id || task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
