import { useState, useMemo } from 'react'
import { format, isSameDay, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Clock, Trash2, Pencil } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import { useTasks } from '../hooks/useTasks'
import CalendarView from '../components/calendar/CalendarView'
import EventForm from '../components/calendar/EventForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

function parseDate(val) {
  if (!val) return null
  try {
    const d = typeof val === 'string' ? parseISO(val) : new Date(val)
    return isValid(d) ? d : null
  } catch { return null }
}

export default function Calendar() {
  const { data: events, create, update, delete: del } = useEvents()
  const { data: tasks } = useTasks()
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  const dayEvents = useMemo(() =>
    events
      .filter((e) => {
        const d = parseDate(e.startTime || e.date)
        return d && isSameDay(d, selectedDay)
      })
      .sort((a, b) => {
        const da = parseDate(a.startTime || a.date)
        const db = parseDate(b.startTime || b.date)
        return (da?.getTime() || 0) - (db?.getTime() || 0)
      }),
    [events, selectedDay]
  )

  const dayTasks = useMemo(() =>
    tasks.filter((t) => {
      const d = parseDate(t.dueDate)
      return d && isSameDay(d, selectedDay)
    }),
    [tasks, selectedDay]
  )

  const handleCreate = async (data) => {
    try {
      await create(data)
      toast.success('Evento creado')
      setModalOpen(false)
    } catch {}
  }

  const handleUpdate = async (data) => {
    try {
      await update(editingEvent._id || editingEvent.id, data)
      toast.success('Evento actualizado')
      setEditingEvent(null)
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await del(id)
      toast.success('Evento eliminado')
    } catch {}
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} eventos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <CalendarView
            events={events}
            tasks={tasks}
            onDayClick={setSelectedDay}
            selectedDay={selectedDay}
          />
        </div>

        {/* Day detail panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 capitalize">
              {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </h3>

            {dayEvents.length === 0 && dayTasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin eventos ni tareas este día</p>
            ) : null}

            {dayEvents.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Eventos</p>
                <div className="flex flex-col gap-2">
                  {dayEvents.map((event) => {
                    const start = parseDate(event.startTime)
                    return (
                      <div
                        key={event._id || event.id}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl group"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: event.color || '#6366f1' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                          {start && !event.allDay && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {format(start, 'HH:mm')}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="p-1 rounded text-gray-400 hover:text-indigo-500 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event._id || event.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {dayTasks.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tareas con fecha límite</p>
                <div className="flex flex-col gap-1.5">
                  {dayTasks.map((task) => (
                    <div
                      key={task._id || task.id}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                        task.completed ? 'text-gray-400 bg-gray-50 line-through' : 'text-gray-700 bg-amber-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo evento" size="lg">
        <EventForm
          defaultDate={selectedDay}
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} title="Editar evento" size="lg">
        {editingEvent && (
          <EventForm
            initial={editingEvent}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </Modal>
    </div>
  )
}
