import { useState, useMemo, useCallback } from 'react'
import { Plus, Flame, Target, Trophy, ChevronRight, Repeat } from 'lucide-react'
import { format, startOfWeek, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useHabits } from '../hooks/useHabits'
import HabitCard from '../components/habits/HabitCard'
import HabitForm from '../components/habits/HabitForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

// --- Weekly focus helpers ---
const FOCUS_ID_KEY = 'qh_weekly_focus_id'
const FOCUS_WEEK_KEY = 'qh_weekly_focus_start'

function thisWeekStart() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function getFocusId() {
  const stored = localStorage.getItem(FOCUS_ID_KEY)
  const week = localStorage.getItem(FOCUS_WEEK_KEY)
  if (week !== thisWeekStart()) return null
  return stored || null
}

function saveFocusId(id) {
  localStorage.setItem(FOCUS_ID_KEY, id)
  localStorage.setItem(FOCUS_WEEK_KEY, thisWeekStart())
}

function clearFocus() {
  localStorage.removeItem(FOCUS_ID_KEY)
  localStorage.removeItem(FOCUS_WEEK_KEY)
}

// Count how many days this week a habit was checked in
function weekCompletions(habit) {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
  const logs = habit.logs || []
  return days.filter((d) => logs.some((l) => l.completed && l.date === d)).length
}

function StatBlock({ icon: Icon, value, label, bg, iconColor }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-white border border-stone-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-stone-900">{value}</p>
        <p className="text-xs text-stone-500">{label}</p>
      </div>
    </motion.div>
  )
}

function FocusHabitCard({ habit, onCheckIn, onChangeFocus }) {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const isCheckedToday = (habit.logs || []).some((l) => l.completed && l.date === todayStr)
  const weekDone = weekCompletions(habit)

  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const color = habit.color && habit.color.startsWith('#') ? habit.color : '#7c3aed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">
            Hábito de la semana
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{habit.icon || '✨'}</span>
            <h2 className="text-xl font-bold text-stone-900">{habit.name}</h2>
          </div>
        </div>
        <button
          onClick={onChangeFocus}
          className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 mt-1"
        >
          Cambiar <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-bold text-stone-800">{habit.streak || 0} días de racha</span>
        <span className="text-xs text-stone-400 ml-2">·</span>
        <span className="text-xs text-stone-500">{weekDone}/7 esta semana</span>
      </div>

      {/* Weekly progress dots */}
      <div className="flex gap-2 mb-5">
        {weekDays.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const checked = (habit.logs || []).some((l) => l.completed && l.date === dayStr)
          const isPast = day <= today
          const isCurrentDay = dayStr === todayStr

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-[10px] text-stone-400 capitalize">
                {format(day, 'EEE', { locale: es }).slice(0, 2)}
              </span>
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                  checked
                    ? 'shadow-sm'
                    : isCurrentDay
                    ? 'border-2 border-dashed border-stone-300'
                    : isPast
                    ? 'bg-stone-100'
                    : 'bg-stone-50'
                }`}
                style={checked ? { backgroundColor: color + '20', border: `2px solid ${color}` } : {}}
              >
                {checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Check-in button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => !isCheckedToday && onCheckIn(habit._id || habit.id, todayStr)}
        disabled={isCheckedToday}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isCheckedToday
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
            : 'text-white shadow-sm hover:shadow-md active:scale-[0.98]'
        }`}
        style={!isCheckedToday ? { backgroundColor: color } : {}}
      >
        {isCheckedToday ? '✓ Completado hoy' : 'Marcar como hecho'}
      </motion.button>
    </motion.div>
  )
}

function FocusPickerModal({ habits, onPick, onClose, currentFocusId }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
      >
        <h3 className="text-base font-bold text-stone-900 mb-1">Elige tu hábito de la semana</h3>
        <p className="text-xs text-stone-500 mb-4">
          Enfócate en adoptar <strong>un solo hábito</strong> esta semana. El resto estará en pausa.
        </p>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {habits.map((h) => (
            <button
              key={h._id || h.id}
              onClick={() => onPick(h._id || h.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:bg-violet-50 hover:border-violet-200 ${
                (h._id || h.id) === currentFocusId
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-stone-100'
              }`}
            >
              <span className="text-xl">{h.icon || '✨'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">{h.name}</p>
                <p className="text-xs text-stone-400">{h.streak || 0} días de racha</p>
              </div>
              {(h._id || h.id) === currentFocusId && (
                <span className="text-xs text-violet-600 font-medium">Actual</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function Habits() {
  const { data: habits, loading, create, update, delete: del, checkIn } = useHabits()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusId, setFocusId] = useState(() => getFocusId())

  const focusHabit = useMemo(
    () => habits.find((h) => (h._id || h.id) === focusId) || null,
    [habits, focusId]
  )

  const otherHabits = useMemo(
    () => habits.filter((h) => (h._id || h.id) !== focusId),
    [habits, focusId]
  )

  const isNewWeek = useMemo(
    () => localStorage.getItem(FOCUS_WEEK_KEY) !== thisWeekStart(),
    []
  )

  const stats = useMemo(() => {
    if (habits.length === 0) return { totalStreak: 0, completionRate: 0, bestStreak: 0 }

    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0)
    const bestStreak = Math.max(...habits.map((h) => h.streak || 0))

    const dailyHabits = habits.filter((h) => h.frequency === 'daily')
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), i), 'yyyy-MM-dd')
    )
    const possibleSlots = dailyHabits.length * 7
    const completedSlots = dailyHabits.reduce((sum, h) => {
      const matched = last7Days.filter(
        (d) => (h.logs || []).some((l) => l.completed && l.date === d)
      ).length
      return sum + matched
    }, 0)
    const completionRate = possibleSlots > 0 ? Math.round((completedSlots / possibleSlots) * 100) : 0

    return { totalStreak, completionRate, bestStreak }
  }, [habits])

  const handleCreate = async (data) => {
    try {
      const created = await create(data)
      toast.success('Hábito creado')
      setModalOpen(false)
      // Auto-set as focus if none is set
      const id = created?._id || created?.id
      if (!focusId && id) {
        saveFocusId(id)
        setFocusId(id)
      }
    } catch {}
  }

  const handleUpdate = async (data) => {
    try {
      await update(editingHabit._id || editingHabit.id, data)
      toast.success('Hábito actualizado')
      setEditingHabit(null)
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await del(id)
      toast.success('Hábito eliminado')
      if (id === focusId) {
        clearFocus()
        setFocusId(null)
      }
    } catch {}
  }

  const handleCheckIn = async (id, date) => {
    try {
      await checkIn(id, date)
      toast.success('¡Hábito completado! 🔥')
    } catch {}
  }

  const handlePickFocus = useCallback((id) => {
    saveFocusId(id)
    setFocusId(id)
    setPickerOpen(false)
    toast.success('Hábito de la semana actualizado')
  }, [])

  const weekLabel = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "'Semana del' d 'de' MMMM", { locale: es })

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Hábitos</h1>
          <p className="text-sm text-stone-500 capitalize mt-0.5">{weekLabel}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo hábito
        </Button>
      </motion.div>

      {/* Stats */}
      {!loading && habits.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatBlock
            icon={Flame}
            value={stats.bestStreak}
            label="Mejor racha"
            bg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatBlock
            icon={Target}
            value={`${stats.completionRate}%`}
            label="Últimos 7 días"
            bg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatBlock
            icon={Trophy}
            value={stats.totalStreak}
            label="Días acumulados"
            bg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-48 skeleton" />)}
        </motion.div>
      )}

      {!loading && habits.length === 0 && (
        <motion.div
          variants={item}
          className="text-center py-16 bg-white border border-stone-100 rounded-2xl shadow-sm"
        >
          <Repeat className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-stone-700 mb-1">Sin hábitos todavía</p>
          <p className="text-sm text-stone-400 mb-4 max-w-xs mx-auto">
            Empieza con <strong>un solo hábito</strong>. La constancia supera a la cantidad.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Crear mi primer hábito
          </Button>
        </motion.div>
      )}

      {/* New week prompt */}
      <AnimatePresence>
        {!loading && habits.length > 0 && (isNewWeek || !focusId) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl mt-0.5">🌱</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {isNewWeek ? '¡Nueva semana! ¿En qué hábito te enfocarás?' : '¿Cuál es tu hábito de esta semana?'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Elige solo uno. Adoptar hábitos de a uno a la vez funciona mucho mejor.
              </p>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              Elegir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus habit */}
      <AnimatePresence>
        {!loading && focusHabit && (
          <motion.div variants={item} key={focusHabit._id || focusHabit.id}>
            <FocusHabitCard
              habit={focusHabit}
              onCheckIn={handleCheckIn}
              onChangeFocus={() => setPickerOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other habits */}
      {!loading && otherHabits.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-stone-500">
              {focusId ? 'Otros hábitos' : 'Todos tus hábitos'}
            </h2>
            {focusId && (
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                en segundo plano esta semana
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {otherHabits.map((habit) => (
                <motion.div
                  key={habit._id || habit.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: focusId ? 0.75 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <HabitCard
                    habit={habit}
                    onCheckIn={handleCheckIn}
                    onEdit={setEditingHabit}
                    onDelete={handleDelete}
                    compact
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Focus picker modal */}
      <AnimatePresence>
        {pickerOpen && (
          <FocusPickerModal
            habits={habits}
            onPick={handlePickFocus}
            onClose={() => setPickerOpen(false)}
            currentFocusId={focusId}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo hábito" size="lg">
        <HabitForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editingHabit} onClose={() => setEditingHabit(null)} title="Editar hábito" size="lg">
        {editingHabit && (
          <HabitForm
            initial={editingHabit}
            onSubmit={handleUpdate}
            onCancel={() => setEditingHabit(null)}
          />
        )}
      </Modal>
    </motion.div>
  )
}
