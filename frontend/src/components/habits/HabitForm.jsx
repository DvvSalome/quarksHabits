import { useState } from 'react'
import Button from '../ui/Button'
import Input, { Select } from '../ui/Input'

const PRESET_COLORS = [
  { name: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
  { name: 'purple', label: 'Morado', bg: 'bg-purple-500' },
  { name: 'green', label: 'Verde', bg: 'bg-green-500' },
  { name: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { name: 'red', label: 'Rojo', bg: 'bg-red-500' },
  { name: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
  { name: 'pink', label: 'Rosa', bg: 'bg-pink-500' },
  { name: 'teal', label: 'Verde azulado', bg: 'bg-teal-500' },
]

const EMOJI_OPTIONS = ['🏃', '📚', '💧', '🧘', '💪', '🎯', '✍️', '🎵', '🌿', '😴', '🥗', '🧹']

const defaultForm = {
  name: '',
  frequency: 'daily',
  color: 'indigo',
  icon: '✨',
}

export default function HabitForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || defaultForm)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Nombre *"
        value={form.name}
        onChange={set('name')}
        placeholder="ej. Meditar 10 minutos"
        error={errors.name}
        autoFocus
      />

      <Select label="Frecuencia" value={form.frequency} onChange={set('frequency')}>
        <option value="daily">Diaria</option>
        <option value="weekly">Semanal</option>
      </Select>

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(({ name, bg }) => (
            <button
              key={name}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: name }))}
              className={`w-7 h-7 rounded-full ${bg} transition-transform ${
                form.color === name ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Icono</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                form.icon === emoji
                  ? 'bg-indigo-100 ring-2 ring-indigo-400'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Input
          value={form.icon}
          onChange={set('icon')}
          placeholder="O escribe un emoji"
          className="mt-1"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Guardar cambios' : 'Crear hábito'}
        </Button>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
