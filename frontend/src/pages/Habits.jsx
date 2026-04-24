import { useState, useMemo } from 'react'
import { Plus, Flame, TrendingUp, Target } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useHabits } from '../hooks/useHabits'
import HabitTracker from '../components/habits/HabitTracker'
import HabitForm from '../components/habits/HabitForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

function StatBlock({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function Habits() {
  const { data: habits, loading, create, update, delete: del, checkIn } = useHabits()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  const stats = useMemo(() => {
    if (habits.length === 0) return { totalStreak: 0, completionRate: 0, bestStreak: 0 }

    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0)
    const bestStreak = Math.max(...habits.map((h) => h.streak || 0))

    // Completion rate over last 7 days for daily habits
    const dailyHabits = habits.filter((h) => h.frequency === 'daily')
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'))
    const possibleSlots = dailyHabits.length * 7
    const completedSlots = dailyHabits.reduce((sum, h) => {
      const logs = h.logs || []
      const matched = last7Days.filter((d) => logs.some((l) => l.completed && l.date === d)).length
      return sum + matched
    }, 0)
    const completionRate = possibleSlots > 0 ? Math.round((completedSlots / possibleSlots) * 100) : 0

    return { totalStreak, completionRate, bestStreak }
  }, [habits])

  const handleCreate = async (data) => {
    try {
      await create(data)
      toast.success('Hábito creado')
      setModalOpen(false)
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
    } catch {}
  }

  const handleCheckIn = async (id, date) => {
    try {
      await checkIn(id, date)
      toast.success('Hábito completado')
    } catch {}
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hábitos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {habits.length} hábito{habits.length !== 1 ? 's' : ''} configurado{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo hábito
        </Button>
      </div>

      {/* Stats */}
      {!loading && habits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBlock
            icon={Flame}
            value={stats.bestStreak}
            label="Mejor racha activa"
            color="bg-orange-50 text-orange-500"
          />
          <StatBlock
            icon={Target}
            value={`${stats.completionRate}%`}
            label="Cumplimiento últimos 7 días"
            color="bg-green-50 text-green-600"
          />
          <StatBlock
            icon={TrendingUp}
            value={stats.totalStreak}
            label="Días acumulados en racha"
            color="bg-indigo-50 text-indigo-600"
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <HabitTracker
          habits={habits}
          onCheckIn={handleCheckIn}
          onEdit={setEditingHabit}
          onDelete={handleDelete}
        />
      )}

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
    </div>
  )
}
