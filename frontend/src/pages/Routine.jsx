import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon, Plus, Pencil, Trash2, Sparkles, Loader2,
  Clock, Check, X, AlertCircle, Sun, Cloud, Zap,
  CalendarDays, ListChecks,
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
  morning: {
    label: 'Mañana',
    icon: Sun,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    dot: 'bg-amber-400',
    range: '00:00 — 12:00',
  },
  afternoon: {
    label: 'Tarde',
    icon: Cloud,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    dot: 'bg-orange-400',
    range: '12:00 — 18:00',
  },
  evening: {
    label: 'Noche',
    icon: Moon,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    dot: 'bg-violet-400',
    range: '18:00 — 23:59',
  },
  unassigned: {
    label: 'Sin hora',
    icon: Zap,
    color: 'text-stone-500',
    bg: 'bg-stone-50',
    border: 'border-stone-100',
    dot: 'bg-stone-300',
    range: '',
  },
}

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-900">
            {mode === 'edit' ? 'Editar bloque' : 'Nuevo bloque'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-600 mb-1.5 block">¿Qué harás?</label>
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="ej. Revisar correos, gym, lectura..."
            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-600 mb-1.5 block">Hora (opcional)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          {startTime && (
            <p className="text-xs text-stone-400 mt-1.5">
              Se agrupará en <span className="font-medium text-stone-600">{PERIODS[getPeriod(startTime)].label}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancelar
          </button>
          <Button type="submit" disabled={!valid || saving} loading={saving} className="flex-1">
            <Check className="w-3.5 h-3.5" />
            {mode === 'edit' ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  )
}

function TaskItem({ task, onEdit, onDelete, onToggleComplete, period }) {
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
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border group transition-all ${
        completed
          ? 'bg-stone-50 border-stone-100 opacity-60'
          : `${config.bg} ${config.border}`
      }`}
    >
      <button
        onClick={() => onToggleComplete(task.id || task._id, !completed)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-stone-300 hover:border-emerald-400 bg-white'
        }`}
      >
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      <Icon className={`w-3.5 h-3.5 ${completed ? 'text-stone-300' : config.color} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm break-words ${completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
          {task.activity}
        </p>
        {task.startTime && (
          <p className={`text-xs font-mono mt-0.5 ${completed ? 'text-stone-300' : 'text-stone-400'}`}>
            {task.startTime}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-violet-600 hover:bg-white transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-white transition-colors disabled:opacity-40"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  )
}

function SuggestionItem({ suggestion, onAdd, adding }) {
  const period = getPeriod(suggestion.startTime)
  const config = PERIODS[period]

  return (
    <div className={`flex items-start gap-3 p-3 ${config.bg} border ${config.border} rounded-xl`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mt-2 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800">{suggestion.activity}</p>
        {suggestion.startTime && (
          <p className="text-xs text-stone-500 font-mono mt-0.5">{suggestion.startTime}</p>
        )}
        {suggestion.reason && (
          <p className="text-xs text-stone-400 mt-1 italic">{suggestion.reason}</p>
        )}
      </div>
      <button
        onClick={() => onAdd(suggestion)}
        disabled={adding}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors flex-shrink-0"
      >
        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
      </button>
    </div>
  )
}

export default function Routine({ onStartPomodoro }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Smart default: after 8pm → plan for tomorrow; otherwise → today
  const defaultTab = new Date().getHours() >= 20 ? 'tomorrow' : 'today'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const planDate = activeTab === 'today' ? today : tomorrow

  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const tomorrowLabel = format(addDays(new Date(), 1), "EEEE d 'de' MMMM", { locale: es })
  const currentLabel = activeTab === 'today' ? todayLabel : tomorrowLabel

  const routine = useRoutine({ planDate })
  const tasksHook = useTasks()
  const habitsHook = useHabits()
  const eventsHook = useEvents()

  const [formState, setFormState] = useState(null)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [aiError, setAiError] = useState('')
  const [addingIdx, setAddingIdx] = useState(null)

  const contextEvents = useMemo(
    () =>
      eventsHook.data
        .filter((e) => e.startTime && String(e.startTime).slice(0, 10) === planDate)
        .map((e) => ({
          title: e.title,
          startTime: e.startTime
            ? new Date(e.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : null,
        })),
    [eventsHook.data, planDate]
  )

  const pendingTasks = useMemo(() =>
    tasksHook.data.filter((t) => !t.completed),
    [tasksHook.data]
  )

  const tasksByPeriod = useMemo(() => {
    const grouped = { morning: [], afternoon: [], evening: [], unassigned: [] }
    routine.data.forEach((t) => {
      grouped[getPeriod(t.startTime)].push(t)
    })
    Object.keys(grouped).forEach((k) => {
      grouped[k].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    })
    return grouped
  }, [routine.data])

  const completedCount = useMemo(
    () => routine.data.filter((t) => t.completed).length,
    [routine.data]
  )

  const progressPct = routine.data.length > 0
    ? Math.round((completedCount / routine.data.length) * 100)
    : 0

  const closeForm = () => setFormState(null)

  const handleSave = async ({ activity, startTime }) => {
    if (saving) return
    setSaving(true)
    try {
      if (formState && formState !== 'new' && formState.task) {
        const id = formState.task.id || formState.task._id
        await routine.update(id, { activity, startTime })
        toast.success('Bloque actualizado')
      } else {
        await routine.create({ activity, startTime })
        toast.success('Bloque agregado al plan')
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
      toast.success('Bloque eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleToggleComplete = async (id, completed) => {
    try {
      await routine.toggleComplete(id, completed)
      if (completed) toast.success('¡Bien hecho! 🎉')
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
        date: currentLabel,
        currentTasks: routine.data.map((t) => ({ activity: t.activity, startTime: t.startTime })),
        pendingTasks: pendingTasks.map((t) => ({ title: t.title, priority: t.priority })),
        tomorrowEvents: contextEvents,
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
      toast.success('Agregado al plan')
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

  const isToday = activeTab === 'today'
  const hour = new Date().getHours()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Mi rutina</h1>
            <p className="text-sm text-stone-500 capitalize">{currentLabel}</p>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div className="relative flex bg-stone-100 rounded-2xl p-1 w-fit gap-1">
        {[
          { key: 'today', label: 'Hoy', icon: Sun },
          { key: 'tomorrow', label: 'Mañana', icon: Moon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              setSuggestions([])
            }}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 z-10 ${
              activeTab === key
                ? 'text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={`w-3.5 h-3.5 relative z-10 ${activeTab === key ? 'text-violet-600' : ''}`} />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Context hint */}
      <AnimatePresence mode="wait">
        {isToday && routine.data.length === 0 && !routine.loading && (
          <motion.div
            key="today-hint"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4"
          >
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {hour < 12
                  ? '¿Olvidaste planificar anoche? No importa, agrega tu plan ahora.'
                  : 'Planifica el resto de tu día desde aquí.'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Lo ideal es planificar la noche anterior, ¡pero siempre puedes ajustar sobre la marcha!
              </p>
            </div>
          </motion.div>
        )}
        {!isToday && hour < 18 && routine.data.length === 0 && !routine.loading && (
          <motion.div
            key="tomorrow-hint"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-2xl p-4"
          >
            <span className="text-xl">🌙</span>
            <div>
              <p className="text-sm font-medium text-violet-800">Planifica tu día de mañana esta noche.</p>
              <p className="text-xs text-violet-600 mt-0.5">
                Configurarlo antes de dormir te ayuda a empezar el día con claridad.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar (only if there are blocks) */}
      <AnimatePresence>
        {routine.data.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-stone-500 font-medium flex-shrink-0">
              {completedCount}/{routine.data.length} completados
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context chips */}
      {(contextEvents.length > 0 || pendingTasks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {contextEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-700">{e.title}{e.startTime ? ` — ${e.startTime}` : ''}</span>
            </div>
          ))}
          {pendingTasks.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
              <ListChecks className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-700">{pendingTasks.length} tareas pendientes</span>
            </div>
          )}
        </div>
      )}

      {/* Add block button */}
      <button
        onClick={() => setFormState('new')}
        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-stone-200 bg-white rounded-2xl text-sm text-stone-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/30 transition-all font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar bloque
      </button>

      {/* Plan by periods */}
      <AnimatePresence mode="wait">
        <motion.div
          key={planDate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4"
        >
          {routine.loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton" />)}
            </div>
          ) : (
            ['morning', 'afternoon', 'evening', 'unassigned'].map((period) => {
              const config = PERIODS[period]
              const Icon = config.icon
              const periodTasks = tasksByPeriod[period]

              return (
                <Card key={period}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-stone-700">{config.label}</h3>
                    {config.range && (
                      <span className="text-xs text-stone-400 ml-auto">{config.range}</span>
                    )}
                    {periodTasks.length > 0 && !config.range && (
                      <span className="text-xs text-stone-400 ml-auto bg-stone-50 px-2 py-0.5 rounded-full">
                        {periodTasks.length}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {periodTasks.length === 0 ? (
                      <p className="text-sm text-stone-300 py-2 text-center">
                        Sin bloques en este período
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {periodTasks.map((task) => (
                          <TaskItem
                            key={task.id || task._id}
                            task={task}
                            onEdit={(t) => setFormState({ task: t })}
                            onDelete={handleDelete}
                            onToggleComplete={handleToggleComplete}
                            onStartPomodoro={onStartPomodoro}
                            period={period}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </Card>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* AI suggestions */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Sugerir con IA</h3>
            <p className="text-xs text-stone-400">Analiza tu contexto y propone qué hacer</p>
          </div>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{aiError}</p>
          </div>
        )}

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 mb-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Sugerencias ({suggestions.length})
                </p>
                <button
                  onClick={() => setSuggestions([])}
                  className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"
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
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={handleAISuggest} loading={aiLoading} className="w-full">
          <Sparkles className="w-4 h-4" />
          {suggestions.length > 0 ? 'Regenerar' : 'Sugerir bloques'}
        </Button>
      </Card>

      {/* Task form modal */}
      <AnimatePresence>
        {formState && (
          <TaskFormModal
            mode={isEditing ? 'edit' : 'new'}
            initial={formInitial}
            onSave={handleSave}
            onCancel={closeForm}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
