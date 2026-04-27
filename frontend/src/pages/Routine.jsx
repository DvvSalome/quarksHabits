import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Moon, Plus, Pencil, Trash2, Sparkles, Loader2,
  Clock, Check, X, AlertCircle, Sun, Cloud, Zap, Timer,
} from 'lucide-react'
import { useRoutine } from '../hooks/useRoutine'
import { useTasks } from '../hooks/useTasks'
import { useHabits } from '../hooks/useHabits'
import { useEvents } from '../hooks/useEvents'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import client from '../api/client'
import toast from 'react-hot-toast'

function readAiConfig() {
  const provider = localStorage.getItem('ai_provider') || 'openrouter'
  const apiKey = provider === 'gemini'
    ? localStorage.getItem('ai_gemini_key')
    : localStorage.getItem('ai_api_key')
  const model = provider === 'gemini'
    ? localStorage.getItem('ai_gemini_model')
    : localStorage.getItem('ai_model')
  return { provider, apiKey, model }
}

function getPeriod(startTime) {
  if (!startTime) return 'unassigned'
  const hour = parseInt(startTime.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const PERIODS = {
  morning: { label: 'Mañana', icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', range: '00:00 - 12:00' },
  afternoon: { label: 'Tarde', icon: Cloud, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', range: '12:00 - 18:00' },
  evening: { label: 'Noche', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', range: '18:00 - 23:59' },
  unassigned: { label: 'Sin hora', icon: Zap, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', range: '' },
}

// Modal-style form. Single source of truth, no inline forms.
function TaskFormModal({ initial, onSave, onCancel, saving, mode }) {
  const [activity, setActivity] = useState(initial?.activity || '')
  const [startTime, setStartTime] = useState(initial?.startTime || '')

  const valid = activity.trim().length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!valid || saving) return
    onSave({ activity: activity.trim(), startTime: startTime || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Editar tarea' : 'Nueva tarea'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Tarea</label>
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="¿Qué harás?"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Hora (opcional)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300"
          />
          {startTime && (
            <p className="text-xs text-gray-400 mt-1">
              Se agrupará en: <span className="font-medium">{PERIODS[getPeriod(startTime)].label}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <Button type="submit" disabled={!valid || saving} loading={saving} className="flex-1">
            <Check className="w-3.5 h-3.5" />
            {mode === 'edit' ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function TaskItem({ task, onEdit, onDelete, onToggleComplete, onStartPomodoro, period }) {
  const [deleting, setDeleting] = useState(false)
  const config = PERIODS[period]
  const Icon = config.icon
  const completed = task.completed

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(task.id || task._id) }
    finally { setDeleting(false) }
  }

  return (
    <div className={`flex items-center gap-3 p-3 ${completed ? 'bg-gray-50 border-gray-100' : `${config.bg} ${config.border}`} border rounded-xl group hover:shadow-sm transition-all`}>
      <button
        onClick={() => onToggleComplete(task.id || task._id, !completed)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400 bg-white'
        }`}
        aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <Icon className={`w-4 h-4 ${completed ? 'text-gray-300' : config.color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm break-words ${completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {task.activity}
        </p>
        {task.startTime && (
          <p className={`text-xs font-mono mt-0.5 ${completed ? 'text-gray-300' : 'text-gray-500'}`}>
            {task.startTime}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!completed && onStartPomodoro && (
          <button
            onClick={() => onStartPomodoro(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
            aria-label="Iniciar Pomodoro"
            title="Iniciar Pomodoro (25 min)"
          >
            <Timer className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white transition-colors"
          aria-label="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-colors disabled:opacity-40"
          aria-label="Eliminar"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function SuggestionItem({ suggestion, onAdd, adding }) {
  const period = getPeriod(suggestion.startTime)
  const config = PERIODS[period]
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 p-3 ${config.bg} border ${config.border} rounded-xl`}>
      <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{suggestion.activity}</p>
        {suggestion.startTime && <p className="text-xs text-gray-500 font-mono mt-0.5">{suggestion.startTime}</p>}
        {suggestion.reason && <p className="text-xs text-gray-400 mt-1 italic">{suggestion.reason}</p>}
      </div>
      <button
        onClick={() => onAdd(suggestion)}
        disabled={adding}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        aria-label="Agregar al plan"
      >
        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
      </button>
    </div>
  )
}

export default function Routine({ onStartPomodoro }) {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const tomorrowLabel = format(addDays(new Date(), 1), "EEEE d 'de' MMMM", { locale: es })

  const routine = useRoutine({ planDate: tomorrow })
  const tasksHook = useTasks()
  const habitsHook = useHabits()
  const eventsHook = useEvents()

  // Single source of truth for form state
  // null = closed, 'new' = creating, { task } = editing
  const [formState, setFormState] = useState(null)
  const [saving, setSaving] = useState(false)

  const [aiLoading, setAiLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [aiError, setAiError] = useState('')
  const [addingIdx, setAddingIdx] = useState(null)

  const tomorrowEvents = useMemo(
    () =>
      eventsHook.data
        .filter((e) => e.startTime && String(e.startTime).slice(0, 10) === tomorrow)
        .map((e) => ({
          title: e.title,
          startTime: e.startTime
            ? new Date(e.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : null,
        })),
    [eventsHook.data, tomorrow]
  )

  const pendingTasks = useMemo(() => tasksHook.data.filter((t) => !t.completed), [tasksHook.data])

  const tasksByPeriod = useMemo(() => {
    const grouped = { morning: [], afternoon: [], evening: [], unassigned: [] }
    routine.data.forEach((t) => {
      const period = getPeriod(t.startTime)
      grouped[period].push(t)
    })
    Object.keys(grouped).forEach((k) => {
      grouped[k].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    })
    return grouped
  }, [routine.data])

  const closeForm = () => setFormState(null)

  const handleSave = async ({ activity, startTime }) => {
    if (saving) return
    setSaving(true)
    try {
      if (formState && formState !== 'new' && formState.task) {
        const id = formState.task.id || formState.task._id
        await routine.update(id, { activity, startTime })
        toast.success('Tarea actualizada')
      } else {
        await routine.create({ activity, startTime })
        toast.success('Tarea agregada')
      }
      setFormState(null)
    } catch (err) {
      toast.error('Error al guardar: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await routine.delete(id)
      toast.success('Tarea eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleToggleComplete = async (id, completed) => {
    try {
      await routine.toggleComplete(id, completed)
      if (completed) toast.success('¡Bien hecho!')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleAISuggest = async () => {
    const { apiKey, model, provider } = readAiConfig()
    if (!apiKey || !model) {
      setAiError('Configura tu API Key en Ajustes primero.')
      return
    }
    setAiLoading(true)
    setAiError('')
    setSuggestions([])
    try {
      const res = await client.post('/ai/plan', {
        apiKey, model, provider,
        date: tomorrowLabel,
        currentTasks: routine.data.map((t) => ({ activity: t.activity, startTime: t.startTime })),
        pendingTasks: pendingTasks.map((t) => ({ title: t.title, priority: t.priority })),
        tomorrowEvents,
        habits: habitsHook.data.map((h) => ({ name: h.name, streak: h.streak })),
      })
      setSuggestions(res.data.suggestions || [])
      if (!res.data.suggestions?.length) toast.success('¡El plan ya está completo!')
    } catch (err) {
      setAiError(err.response?.data?.error || err.message || 'Error desconocido')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAddSuggestion = async (suggestion, idx) => {
    setAddingIdx(idx)
    try {
      await routine.create({
        activity: suggestion.activity,
        startTime: suggestion.startTime || null,
      })
      setSuggestions((prev) => prev.filter((_, i) => i !== idx))
      toast.success('Tarea agregada al plan')
    } catch {
      toast.error('Error al agregar')
    } finally {
      setAddingIdx(null)
    }
  }

  const isEditing = formState && formState !== 'new'
  const formInitial = isEditing
    ? { activity: formState.task.activity, startTime: formState.task.startTime || '' }
    : { activity: '', startTime: '' }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plan para mañana</h1>
            <p className="text-sm text-gray-500 capitalize">{tomorrowLabel}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2 ml-12">
          Planifica esta noche para tener un día productivo mañana.
        </p>
      </div>

      {/* Context chips */}
      {(tomorrowEvents.length > 0 || pendingTasks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {tomorrowEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-700">{e.title}{e.startTime ? ` — ${e.startTime}` : ''}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
            <span className="text-xs text-amber-700">{pendingTasks.length} tareas pendientes</span>
          </div>
        </div>
      )}

      {/* Add task button */}
      <button
        onClick={() => setFormState('new')}
        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl text-sm text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar tarea
      </button>

      {/* Plan by periods */}
      <div className="flex flex-col gap-4">
        {['morning', 'afternoon', 'evening', 'unassigned'].map((period) => {
          const config = PERIODS[period]
          const Icon = config.icon
          const periodTasks = tasksByPeriod[period]

          return (
            <Card key={period}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
                {config.range && <span className="text-xs text-gray-400 ml-auto">{config.range}</span>}
                {periodTasks.length > 0 && (
                  <span className="text-xs text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full">
                    {periodTasks.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {periodTasks.length === 0 ? (
                  <p className="text-sm text-gray-300 py-2 text-center">Sin tareas en este período</p>
                ) : (
                  periodTasks.map((task) => (
                    <TaskItem
                      key={task.id || task._id}
                      task={task}
                      onEdit={(t) => setFormState({ task: t })}
                      onDelete={handleDelete}
                      onToggleComplete={handleToggleComplete}
                      onStartPomodoro={onStartPomodoro}
                      period={period}
                    />
                  ))
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* AI suggestions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sugerir tareas con IA</h3>
            <p className="text-xs text-gray-400">Analiza tu contexto y propone qué hacer</p>
          </div>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{aiError}</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sugerencias ({suggestions.length})
              </p>
              <button
                onClick={() => setSuggestions([])}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            </div>
            {suggestions.map((s, i) => (
              <SuggestionItem
                key={i}
                suggestion={s}
                onAdd={(sug) => handleAddSuggestion(sug, i)}
                adding={addingIdx === i}
              />
            ))}
          </div>
        )}

        <Button onClick={handleAISuggest} loading={aiLoading} className="w-full">
          <Sparkles className="w-4 h-4" />
          {suggestions.length > 0 ? 'Regenerar sugerencias' : 'Sugerir tareas'}
        </Button>
      </Card>

      {/* Task form modal — rendered ONCE, controlled by formState */}
      {formState && (
        <TaskFormModal
          mode={isEditing ? 'edit' : 'new'}
          initial={formInitial}
          onSave={handleSave}
          onCancel={closeForm}
          saving={saving}
        />
      )}
    </div>
  )
}
