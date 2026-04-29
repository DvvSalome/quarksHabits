import { useState, useMemo } from 'react'
import { format, isToday, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Repeat, Calendar, Flame, Sparkles, ArrowRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

const STAT_STYLES = [
  {
    gradient: 'from-violet-400 via-violet-500 to-purple-700',
    shadow: 'shadow-violet-300/70',
    ring: 'rgba(139,92,246,0.5)',
  },
  {
    gradient: 'from-purple-500 via-fuchsia-500 to-purple-700',
    shadow: 'shadow-purple-300/70',
    ring: 'rgba(168,85,247,0.5)',
  },
  {
    gradient: 'from-indigo-400 via-violet-500 to-indigo-700',
    shadow: 'shadow-indigo-300/70',
    ring: 'rgba(99,102,241,0.5)',
  },
  {
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-700',
    shadow: 'shadow-fuchsia-300/70',
    ring: 'rgba(217,70,239,0.5)',
  },
]

function StatCard({ icon: Icon, label, value, styleIdx = 0 }) {
  const s = STAT_STYLES[styleIdx]

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -7, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: styleIdx * 0.07 }}
      className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${s.gradient} shadow-xl ${s.shadow} cursor-default select-none`}
    >
      {/* Decorative circles */}
      <div className="absolute -right-7 -top-7 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-4 bottom-1 w-16 h-16 rounded-full bg-white/5" />
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div
        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
        style={{ boxShadow: `0 4px 16px ${s.ring}` }}
      >
        <Icon className="w-5 h-5 text-white drop-shadow" />
      </div>

      <motion.p
        key={value}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="text-3xl font-black text-white tabular-nums leading-none"
      >
        {value}
      </motion.p>
      <p className="text-sm text-white/80 mt-1.5 font-medium leading-tight">{label}</p>
    </motion.div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
}

export default function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false)
  const navigate = useNavigate()
  const tasks = useTasks()
  const habits = useHabits()
  const events = useEvents()

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const routine = useRoutine({ planDate: todayStr })

  const greeting = useMemo(() => {
    const h = today.getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
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

  const todayPlan = useMemo(() =>
    routine.data.sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || '')
    ),
    [routine.data]
  )

  const handleToggle = async (id, completed) => {
    try {
      await tasks.toggle(id, completed)
      toast.success(completed ? '¡Tarea completada!' : 'Tarea pendiente')
    } catch {}
  }

  const handleHabitCheckin = async (id, date) => {
    try {
      await habits.checkIn(id, date)
      toast.success('¡Hábito completado!')
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
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col gap-7"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="relative">
        {/* Ambient background glow */}
        <div
          className="absolute -inset-6 rounded-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }}
        />

        <p
          className="text-xs font-semibold uppercase tracking-[0.2em] mb-2 capitalize"
          style={{ color: '#7c3aed' }}
        >
          {dateStr}
        </p>

        <h1 className="text-4xl font-black tracking-tight text-stone-900 leading-none">
          {greeting}{' '}
          <motion.span
            className="inline-block origin-bottom-right"
            animate={{ rotate: [0, 0, 14, -8, 14, -4, 10, 0, 0] }}
            transition={{ duration: 3, delay: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            👋
          </motion.span>
        </h1>

        <p className="text-stone-400 mt-2 font-medium flex items-center gap-1.5">
          Vamos a hacer un día increíble
          <motion.span
            className="inline-block"
            animate={{ scale: [1, 1.35, 1], rotate: [0, 15, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3 }}
          >
            ✨
          </motion.span>
        </p>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Completadas hoy"
          value={completedToday}
          styleIdx={0}
        />
        <StatCard
          icon={Repeat}
          label="Hábitos activos"
          value={habits.data.length}
          styleIdx={1}
        />
        <StatCard
          icon={Calendar}
          label="Eventos hoy"
          value={todayEvents.length}
          styleIdx={2}
        />
        <StatCard
          icon={Flame}
          label="Racha más larga"
          value={maxStreak}
          styleIdx={3}
        />
      </motion.div>

      {/* ── Tasks + Events row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item}>
          <Card animate gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-700" />
                <h3 className="text-sm font-semibold text-stone-800">Tareas de hoy</h3>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-semibold transition-colors group"
              >
                Ver todas
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {tasks.loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 skeleton" />)}
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-stone-400 font-medium">Sin tareas pendientes</p>
              </div>
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
        </motion.div>

        <motion.div variants={item}>
          <Card animate gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-violet-700" />
                <h3 className="text-sm font-semibold text-stone-800">Agenda de hoy</h3>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-semibold transition-colors group"
              >
                Calendario
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {events.loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => <div key={i} className="h-12 skeleton" />)}
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-stone-400 font-medium">Sin eventos hoy</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayEvents.map((event) => {
                  const start = parseDate(event.startTime)
                  return (
                    <motion.div
                      key={event._id || event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
                    >
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[2rem]"
                        style={{ backgroundColor: event.color || '#7c3aed' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-stone-400 truncate">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 font-mono flex-shrink-0">
                        {start ? format(start, 'HH:mm') : '--:--'}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Habits ── */}
      <motion.div variants={item}>
        <Card animate gradient>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-fuchsia-400 to-purple-700" />
                <h3 className="text-sm font-semibold text-stone-800">Hábitos</h3>
            </div>
            <button
              onClick={() => navigate('/habits')}
              className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-semibold transition-colors group"
            >
              Ver todos
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {habits.loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-36 skeleton" />)}
            </div>
          ) : habits.data.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
                <Repeat className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-stone-400 font-medium">Sin hábitos configurados</p>
              <button
                onClick={() => navigate('/habits')}
                className="mt-3 text-xs text-violet-600 hover:underline font-semibold"
              >
                Agregar mi primer hábito
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      </motion.div>

      {/* ── Today's Plan ── */}
      <AnimatePresence>
        {todayPlan.length > 0 && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
          >
            <Card animate gradient>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-400 to-violet-700" />
                <h3 className="text-sm font-semibold text-stone-800">Plan de hoy</h3>
                </div>
                <button
                  onClick={() => navigate('/routine')}
                  className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-semibold transition-colors group"
                >
                  Editar
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {todayPlan.map((block, i) => (
                  <motion.div
                    key={block._id || block.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
                      block.completed ? 'opacity-45' : 'hover:bg-stone-50'
                    }`}
                  >
                    {block.startTime && (
                      <span className="text-xs font-mono text-stone-400 w-10 flex-shrink-0">
                        {block.startTime}
                      </span>
                    )}
                    <div
                      className={`flex-1 flex items-center gap-2 ${
                        block.completed ? 'line-through text-stone-400' : 'text-stone-700'
                      }`}
                    >
                      {block.completed && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                      <span className="text-sm">{block.activity}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating AI Button ── */}
      <div className="fixed bottom-8 right-8 z-40">
        {/* Pulsing ambient rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.65, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'rgba(124,58,237,0.45)' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 2.1, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          style={{ background: 'rgba(168,85,247,0.3)' }}
        />

        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.8 }}
          whileHover={{ scale: 1.13 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => setAiOpen(true)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 80%, #c026d3 100%)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
          aria-label="Asistente IA"
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-200% center', '200% center'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
          </motion.div>
        </motion.button>
      </div>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        tasks={tasks.data}
        habits={habits.data}
        events={events.data}
        routine={todayPlan}
      />
    </motion.div>
  )
}
