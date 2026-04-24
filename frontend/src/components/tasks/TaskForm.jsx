import { useState } from 'react'
import Button from '../ui/Button'
import Input, { Select, Textarea } from '../ui/Input'

const defaultForm = {
  title: '',
  description: '',
  priority: 'medium',
  category: '',
  tags: '',
  dueDate: '',
}

export default function TaskForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : initial.tags || '',
          dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        }
      : defaultForm
  )
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'El título es requerido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        dueDate: form.dueDate || null,
      }
      await onSubmit(payload)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Título *"
        value={form.title}
        onChange={set('title')}
        placeholder="¿Qué hay que hacer?"
        error={errors.title}
        autoFocus
      />
      <Textarea
        label="Descripción"
        value={form.description}
        onChange={set('description')}
        placeholder="Detalles opcionales..."
        rows={3}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Prioridad" value={form.priority} onChange={set('priority')}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </Select>
        <Input
          label="Categoría"
          value={form.category}
          onChange={set('category')}
          placeholder="ej. Trabajo"
        />
      </div>
      <Input
        label="Etiquetas (separadas por coma)"
        value={form.tags}
        onChange={set('tags')}
        placeholder="ej. urgente, importante"
      />
      <Input
        label="Fecha límite"
        type="date"
        value={form.dueDate}
        onChange={set('dueDate')}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
