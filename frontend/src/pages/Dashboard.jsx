import { useState, useMemo } from 'react'
import { format, isToday, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { Sparkles, CheckCircle2, Repeat, Calendar, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import { useHabits } from '../hooks/useHabits'
import { useEvents } from '../hooks/useEvents'
import { useRoutine } from '../hooks/useRoutine'
import Card from '../components/ui/Card'
import TaskCard from '../components/tasks/TaskCard'
import HabitCard from '../components/habits/HabitCard'
import AIAssistant from '../components/ai/AIAssistant'
import toast from 'react-hot-toast'

function parseDate(val) {
  if (!val) return null
  try {
    const d = typeof val === 'string' ? parseISO(val) : new Date(val)
    return isValid(d) ? d : null
  } catch { return null }
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function LoadingRow() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 skeleton rounded-xl" />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false)
  const navigate = useNavigate()
  const tasks = useTasks()
  const habits = useHabits()
  const events = useEvents()
  const routine = useRoutine()

  const today = new Date()

  const greeting = useMemo(() => {
    const hour = today.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const dateStr = format(today, "EEEE d 'de' MMMM", { locale: es })

  const todayTasks = useMemo(() =>
    tasks.data
      .filter((t) => {
        if (t.completed) return false
        if (!t.dueDate) return true
        const d = parseDate(t.dueDate)
        return d && isToday(d)
      })
      .slice(0, 5),
    [tasks.data]
  )

  const completedToday = useMemo(() =>
    tasks.data.filter((t) => {
      if (!t.completed) return false
      if (!t.updatedAt) return false
      const d = parseDate(t.updatedAt)
      return d && isToday(d)
    }).length,
    [tasks.data]
  )

  const todayEvents = useMemo(() =>
    events.data
      .filter((e) => {
        const d = parseDate(e.startTime || e.date)
        return d && isToday(d)
      })
      .sort((a, b) => {
        const da = parseDate(a.startTime || a.date)
        const db = parseDate(b.startTime || b.date)
        return (da?.getTime() || 0) - (db?.getTime() || 0)
      }),
    [events.data]
  )

  const maxStreak = useMemo(() =>
    habits.data.reduce((max, h) => Math.max(max, h.streak || 0), 0),
    [habits.data]
  )

  const todayRoutine = useMemo(() => {
    const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = DAYS[today.getDay()]
    return routine.data
      .filter((b) => {
        if (!b.dayOfWeek || b.dayOfWeek === 'all') return true
        try {
          const parsed = JSON.parse(b.dayOfWeek)
          if (Array.isArray(parsed)) return parsed.includes(todayName)
        } catch {}
        return b.dayOfWeek === todayName
      })
      .sort((a, b) => a.startTime?.localeCompare(b.startTime))
  }, [routine.data])

  const handleToggle = async (id, completed) => {
    try {
      await tasks.toggle(id, completed)
      toast.success(completed ? 'Tarea completada' : 'Tarea pendiente')
    } catch {}
  }

  const handleHabitCheckin = async (id, date) => {
    try {
      await habits.checkIn(id, date)
      toast.success('Hábito registrado')
    } catch {}
  }

  const handleDeleteTask = async (id) => {
    try {
      await tasks.delete(id)
      toast.success('Tarea eliminada')
    } catch {}
  }

  const handleDeleteHabit = async (id) => {
    try {
      await habits.delete(id)
      toast.success('Hábito eliminado')
    } catch {}
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 capitalize">
          {greeting}, <span className="text-indigo-600">{dateStr}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Aquí está el resumen de tu día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Tareas completadas hoy"
          value={completedToday}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Repeat}
          label="Hábitos del día"
          value={habits.data.length}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Calendar}
          label="Eventos hoy"
          value={todayEvents.length}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Flame}
          label="Racha máxima"
          value={maxStreak}
          color="bg-orange-50 text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card title="Tareas de hoy">
          {tasks.loading ? (
            <LoadingRow />
          ) : todayTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin tareas para hoy 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={() => navigate('/tasks')}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Today's Events */}
        <Card title="Agenda del día">
          {events.loading ? (
            <LoadingRow />
          ) : todayEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin eventos hoy</p>
          ) : (
            <div className="flex flex-col gap-3">
              {todayEvents.map((event) => {
                const start = parseDate(event.startTime)
                return (
                  <div key={event._id || event.id} className="flex items-start gap-3">
                    <div className="text-xs font-mono text-gray-400 w-12 flex-shrink-0 pt-0.5">
                      {start ? format(start, 'HH:mm') : '--:--'}
                    </div>
                    <div
                      className="w-1 self-stretch rounded-full"
                      style={{ backgroundColor: event.color || '#6366f1' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Today's Habits */}
      <Card title="Hábitos de hoy">
        {habits.loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
          </div>
        ) : habits.data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin hábitos configurados</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.data.map((habit) => (
              <HabitCard
                key={habit._id || habit.id}
                habit={habit}
                onCheckIn={handleHabitCheckin}
                onEdit={() => navigate('/habits')}
                onDelete={handleDeleteHabit}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Routine */}
      {todayRoutine.length > 0 && (
        <Card title="Rutina del día">
          <div className="flex flex-col gap-2">
            {todayRoutine.map((block) => (
              <div key={block._id || block.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-24">
                  {block.startTime}{block.endTime ? ` — ${block.endTime}` : ''}
                </span>
                <span className="text-sm text-gray-700">{block.activity}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Floating AI Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all duration-200 hover:scale-105 flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        tasks={tasks.data}
        habits={habits.data}
        events={events.data}
      />
    </div>
  )
}
