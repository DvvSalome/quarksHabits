import { useState, useMemo } from 'react'
import { format, isToday, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Repeat, Calendar, Flame, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="glass-panel rounded-2xl p-5 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-cyan-50 font-mono tracking-wider">{value}</p>
      <p className="text-xs text-cyan-400/70 mt-1 uppercase tracking-widest">{label}</p>
    </motion.div>
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
    const hour = today.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 19) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  const dateStr = format(today, "EEEE, MMMM do", { locale: es })

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
    routine.data.sort((a, b) => {
      const aTime = a.startTime || ''
      const bTime = b.startTime || ''
      return aTime.localeCompare(bTime)
    }),
    [routine.data]
  )

  const handleToggle = async (id, completed) => {
    try {
      await tasks.toggle(id, completed)
      toast.success(completed ? 'System updated: Task completed' : 'System updated: Task pending')
    } catch {}
  }

  const handleHabitCheckin = async (id, date) => {
    try {
      await habits.checkIn(id, date)
      toast.success('Habit protocol logged')
    } catch {}
  }

  const handleDeleteTask = async (id) => {
    try {
      await tasks.delete(id)
      toast.success('Task purged')
    } catch {}
  }

  const handleDeleteHabit = async (id) => {
    try {
      await habits.delete(id)
      toast.success('Habit purged')
    } catch {}
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="relative">
        <h1 className="text-3xl font-bold text-cyan-50 capitalize glow-text">
          {greeting}, <span className="text-cyan-400">Commander</span>
        </h1>
        <p className="text-sm text-cyan-400/60 mt-1 font-mono uppercase tracking-widest">{dateStr} // System Status: Nominal</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Tasks Completed"
          value={completedToday}
          color="bg-green-950/50 text-green-400 border-green-500/30"
        />
        <StatCard
          icon={Repeat}
          label="Active Habits"
          value={habits.data.length}
          color="bg-indigo-950/50 text-indigo-400 border-indigo-500/30"
        />
        <StatCard
          icon={Calendar}
          label="Events Today"
          value={todayEvents.length}
          color="bg-blue-950/50 text-blue-400 border-blue-500/30"
        />
        <StatCard
          icon={Flame}
          label="Max Streak"
          value={maxStreak}
          color="bg-orange-950/50 text-orange-400 border-orange-500/30"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <motion.div variants={itemVariants}>
          <Card title="ACTIVE DIRECTIVES">
            {tasks.loading ? (
              <LoadingRow />
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-cyan-500/50 text-center py-4 font-mono uppercase">No active directives</p>
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

        {/* Today's Events */}
        <motion.div variants={itemVariants}>
          <Card title="SYSTEM TIMELINE">
            {events.loading ? (
              <LoadingRow />
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-cyan-500/50 text-center py-4 font-mono uppercase">No scheduled events</p>
            ) : (
              <div className="flex flex-col gap-3">
                {todayEvents.map((event) => {
                  const start = parseDate(event.startTime)
                  return (
                    <div key={event._id || event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-cyan-900/20 transition-colors border border-transparent hover:border-cyan-500/20 group">
                      <div className="text-xs font-mono text-cyan-400 w-12 flex-shrink-0 pt-0.5 group-hover:glow-text">
                        {start ? format(start, 'HH:mm') : '--:--'}
                      </div>
                      <div
                        className="w-1 self-stretch rounded-full"
                        style={{ backgroundColor: event.color || '#06b6d4', boxShadow: `0 0 8px ${event.color || '#06b6d4'}` }}
                      />
                      <div>
                        <p className="text-sm font-medium text-cyan-50">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-cyan-400/60 mt-0.5 truncate">{event.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Today's Habits */}
      <motion.div variants={itemVariants}>
        <Card title="ROUTINE PROTOCOLS">
          {habits.loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
            </div>
          ) : habits.data.length === 0 ? (
            <p className="text-sm text-cyan-500/50 text-center py-4 font-mono uppercase">No protocols initialized</p>
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
      </motion.div>

      {/* Today's Plan */}
      {todayPlan.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card title="EXECUTION PLAN">
            <div className="flex flex-col gap-2">
              {todayPlan.map((block) => (
                <div key={block._id || block.id} className="flex items-center gap-3 py-2 border-b border-cyan-900/30 last:border-0 hover:bg-cyan-900/10 px-2 rounded-lg transition-colors">
                  <span className="text-xs font-mono text-cyan-400 font-semibold w-24">
                    {block.startTime}{block.endTime ? ` — ${block.endTime}` : ''}
                  </span>
                  <span className="text-sm text-cyan-100">{block.activity}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Floating AI Button */}
      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setAiOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-950 rounded-full border-2 border-cyan-400 flex items-center justify-center z-40 group overflow-hidden"
        style={{ boxShadow: '0 0 20px rgba(6,182,212,0.5), inset 0 0 10px rgba(6,182,212,0.3)' }}
      >
        <div className="absolute inset-0 bg-cyan-400/20 group-hover:bg-cyan-400/40 transition-colors" />
        <div className="w-12 h-12 border border-cyan-300 rounded-full flex items-center justify-center animate-spin-slow" style={{ animationDuration: '4s' }}>
          <Cpu className="w-6 h-6 text-cyan-300 group-hover:text-cyan-100 glow-text" />
        </div>
      </motion.button>

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
