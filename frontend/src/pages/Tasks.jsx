import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'completed', label: 'Completadas' },
]

const PRIORITIES = [
  { key: 'all', label: 'Cualquier prioridad' },
  { key: 'alta', label: 'Alta' },
  { key: 'media', label: 'Media' },
  { key: 'baja', label: 'Baja' },
]

export default function Tasks() {
  const { data: tasks, loading, create, update, delete: del, toggle } = useTasks()

  const [filter, setFilter] = useState('all')
  const [priority, setPriority] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const filteredTasks = useMemo(() => {
    let list = tasks
    if (filter === 'active') list = list.filter((t) => !t.completed)
    if (filter === 'completed') list = list.filter((t) => t.completed)
    if (priority !== 'all') {
      list = list.filter((t) => {
        const p = t.priority
        return p === priority || (priority === 'alta' && p === 'high') ||
          (priority === 'media' && p === 'medium') || (priority === 'baja' && p === 'low')
      })
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    return list
  }, [tasks, filter, priority, search])

  const handleCreate = async (data) => {
    try {
      await create(data)
      toast.success('Tarea creada')
      setModalOpen(false)
    } catch {}
  }

  const handleUpdate = async (data) => {
    try {
      await update(editingTask._id || editingTask.id, data)
      toast.success('Tarea actualizada')
      setEditingTask(null)
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await del(id)
      toast.success('Tarea eliminada')
    } catch {}
  }

  const handleToggle = async (id, completed) => {
    try {
      await toggle(id, completed)
      toast.success(completed ? 'Tarea completada' : 'Tarea pendiente')
    } catch {}
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tareas en total</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
        >
          {PRIORITIES.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onToggle={handleToggle}
          onEdit={setEditingTask}
          onDelete={handleDelete}
          groupByPriority={filter !== 'completed'}
        />
      )}

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva tarea">
        <TaskForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Editar tarea">
        {editingTask && (
          <TaskForm
            initial={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  )
}
