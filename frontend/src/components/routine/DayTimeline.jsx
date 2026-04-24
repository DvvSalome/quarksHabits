import { useState } from 'react'
import { Plus } from 'lucide-react'
import RoutineBlock from './RoutineBlock'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

function BlockForm({ initial, timeSlot, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial || { activity: '', startTime: '', endTime: '' }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.activity.trim()) { setError('El nombre es requerido'); return }
    if (!form.startTime) { setError('La hora de inicio es requerida'); return }
    if (!form.endTime) { setError('La hora de fin es requerida'); return }
    setLoading(true)
    try {
      await onSubmit({
        title: form.activity.trim(),
        activity: form.activity.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        timeSlot,
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Actividad *"
        value={form.activity}
        onChange={set('activity')}
        placeholder="ej. Ejercicio"
        error={error}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Inicio"
          type="time"
          value={form.startTime}
          onChange={set('startTime')}
        />
        <Input
          label="Fin"
          type="time"
          value={form.endTime}
          onChange={set('endTime')}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Guardar' : 'Agregar'}
        </Button>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

const TIME_SLOT_CONFIG = {
  morning: { label: 'Mañana', icon: '🌅', range: '6:00 - 12:00', color: 'from-amber-50 to-orange-50 border-amber-100' },
  afternoon: { label: 'Tarde', icon: '☀️', range: '12:00 - 18:00', color: 'from-blue-50 to-cyan-50 border-blue-100' },
  evening: { label: 'Noche', icon: '🌙', range: '18:00 - 23:00', color: 'from-indigo-50 to-purple-50 border-indigo-100' },
}

export default function DayTimeline({ blocks, timeSlot, onCreate, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)

  const config = TIME_SLOT_CONFIG[timeSlot]

  const slotBlocks = blocks
    .filter((b) => b.timeSlot === timeSlot)
    .sort((a, b) => a.startTime?.localeCompare(b.startTime))

  const handleCreate = async (data) => {
    await onCreate(data)
    setShowModal(false)
  }

  const handleUpdate = async (data) => {
    await onUpdate(editingBlock._id || editingBlock.id, data)
    setEditingBlock(null)
  }

  return (
    <div className={`bg-gradient-to-b ${config.color} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{config.range}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" />
          Agregar
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {slotBlocks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Sin bloques</p>
        )}
        {slotBlocks.map((block) => (
          <RoutineBlock
            key={block._id || block.id}
            block={block}
            onEdit={(b) => setEditingBlock(b)}
            onDelete={onDelete}
          />
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Agregar bloque — ${config.label}`}
      >
        <BlockForm
          timeSlot={timeSlot}
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingBlock}
        onClose={() => setEditingBlock(null)}
        title="Editar bloque"
      >
        {editingBlock && (
          <BlockForm
            initial={editingBlock}
            timeSlot={timeSlot}
            onSubmit={handleUpdate}
            onCancel={() => setEditingBlock(null)}
          />
        )}
      </Modal>
    </div>
  )
}
