import { useState } from 'react'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'

const COLOR_OPTIONS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

const defaultForm = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  allDay: false,
  color: '#6366f1',
}

function toLocalDatetimeValue(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

export default function EventForm({ initial, defaultDate, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        startTime: toLocalDatetimeValue(initial.startTime),
        endTime: toLocalDatetimeValue(initial.endTime),
      }
    }
    if (defaultDate) {
      const pad = (n) => String(n).padStart(2, '0')
      const d = new Date(defaultDate)
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      return { ...defaultForm, startTime: `${dateStr}T09:00`, endTime: `${dateStr}T10:00` }
    }
    return defaultForm
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'El título es requerido'
    if (!form.allDay && !form.startTime) errs.startTime = 'La hora de inicio es requerida'
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Título *"
        value={form.title}
        onChange={set('title')}
        placeholder="ej. Reunión de equipo"
        error={errors.title}
        autoFocus
      />
      <Textarea
        label="Descripción"
        value={form.description}
        onChange={set('description')}
        placeholder="Detalles del evento..."
        rows={2}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allDay"
          checked={form.allDay}
          onChange={set('allDay')}
          className="w-4 h-4 rounded text-indigo-600"
        />
        <label htmlFor="allDay" className="text-sm text-gray-700">Todo el día</label>
      </div>

      {!form.allDay && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Inicio *"
            type="datetime-local"
            value={form.startTime}
            onChange={set('startTime')}
            error={errors.startTime}
          />
          <Input
            label="Fin"
            type="datetime-local"
            value={form.endTime}
            onChange={set('endTime')}
          />
        </div>
      )}

      {/* Color */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: hex }))}
              style={{ backgroundColor: hex }}
              className={`w-7 h-7 rounded-full transition-transform ${
                form.color === hex ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Guardar cambios' : 'Crear evento'}
        </Button>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
