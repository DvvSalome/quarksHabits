import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useHabits } from '../hooks/useHabits'
import HabitTracker from '../components/habits/HabitTracker'
import HabitForm from '../components/habits/HabitForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function Habits() {
  const { data: habits, loading, create, update, delete: del, checkIn } = useHabits()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

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
