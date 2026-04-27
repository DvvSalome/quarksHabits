import { useState, useMemo, useCallback } from 'react'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, isWithinInterval, parseISO, isValid,
  subDays, isSunday, previousMonday, startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  TrendingUp, CheckCircle2, Repeat, Flame, Calendar,
  Sparkles, Loader2, Trophy, Target, Star, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useHabits } from '../hooks/useHabits'
import { useEvents } from '../hooks/useEvents'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import client from '../api/client'

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

function parseDate(val) {
  if (!val) return null
  try {
    const d = typeof val === 'string' ? parseISO(val) : new Date(val)
    return isValid(d) ? d : null
  } catch { return null }
}

function inInterval(date, interval) {
  if (!date) return false
  return isWithinInterval(startOfDay(date), {
    start: startOfDay(interval.start),
    end: startOfDay(interval.end),
  })
}

// ── Heatmap ──────────────────────────────────────────────────────────────────
function HabitHeatmap({ habits }) {
  const today = new Date()
  const ninetyAgo = subDays(today, 89)
  // Start on the Monday of the week containing 90-days-ago
  const gridStart = isSunday(ninetyAgo) ? ninetyAgo : previousMonday(ninetyAgo)

  const allDays = eachDayOfInterval({ start: gridStart, end: today })

  const completionMap = useMemo(() => {
    const map = {}
    for (const habit of habits) {
      for (const log of (habit.logs || [])) {
        if (log.completed) map[log.date] = (map[log.date] || 0) + 1
      }
    }
    return map
  }, [habits])

  const maxCount = Math.max(1, ...Object.values(completionMap))

  function cellColor(dateStr) {
    const count = completionMap[dateStr] || 0
    if (!count) return '#f3f4f6'
    const ratio = count / maxCount
    if (ratio <= 0.25) return '#bbf7d0'
    if (ratio <= 0.50) return '#4ade80'
    if (ratio <= 0.75) return '#22c55e'
    return '#16a34a'
  }

  // Group into weeks (7-day columns starting Mon)
  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const inRange = (d) => d >= ninetyAgo

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 flex-shrink-0">
          <div className="h-4" />
          {DOW.map((d) => (
            <div key={d} className="w-3 h-3 text-[9px] text-gray-400 flex items-center leading-none">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const showMonth = week.some((d) => d.getDate() <= 7)
          return (
            <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
              <div className="h-4 text-[9px] text-gray-400 leading-none">
                {showMonth ? format(week[0], 'MMM', { locale: es }) : ''}
              </div>
              {week.map((day, di) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const active = inRange(day)
                const count = completionMap[dateStr] || 0
                return (
                  <div
                    key={di}
                    title={
                      active
                        ? `${format(day, 'EEE d MMM', { locale: es })}: ${count} hábito${count !== 1 ? 's' : ''}`
                        : undefined
                    }
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: active ? cellColor(dateStr) : 'transparent' }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[10px] text-gray-400">Menos</span>
        {['#f3f4f6', '#bbf7d0', '#4ade80', '#22c55e', '#16a34a'].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[10px] text-gray-400">Más</span>
      </div>
    </div>
  )
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
            <div
              className="w-full bg-indigo-400 rounded-t transition-all"
              style={{ height: `${(d.value / max) * 88}px`, minHeight: d.value > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
          {d.value > 0 && (
            <span className="text-[9px] font-medium text-indigo-600">{d.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, big }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`font-bold text-gray-900 ${big ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ── AI review panel ──────────────────────────────────────────────────────────
function AIReview({ tasks, habits, events, period, interval }) {
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [error, setError] = useState('')

  const { provider, apiKey, model } = readAiConfig()

  const generate = useCallback(async () => {
    if (!apiKey || !model) {
      setError('Configura tu API Key en Ajustes primero.')
      return
    }
    setLoading(true)
    setError('')
    setReview(null)
    try {
      const completedTasks = tasks.filter((t) => {
        if (!t.completed) return false
        const d = parseDate(t.updatedAt)
        return d && inInterval(d, interval)
      })
      const periodHabitLogs = habits.flatMap((h) =>
        (h.logs || []).filter((l) => l.completed && l.date >= format(interval.start, 'yyyy-MM-dd') && l.date <= format(interval.end, 'yyyy-MM-dd'))
      )
      const periodEvents = events.filter((e) => {
        const d = parseDate(e.startTime)
        return d && inInterval(d, interval)
      })

      const res = await client.post('/ai/review', {
        apiKey, model, provider,
        period: period === 'week' ? 'semana' : 'mes',
        completedTasks: completedTasks.map((t) => ({ title: t.title, priority: t.priority, category: t.category })),
        habitCount: habits.length,
        habitLogsCompleted: periodHabitLogs.length,
        expectedHabitLogs: habits.filter((h) => h.frequency === 'daily').length * (period === 'week' ? 7 : 30),
        eventCount: periodEvents.length,
        maxStreak: Math.max(0, ...habits.map((h) => h.streak || 0)),
      })
      setReview(res.data.review)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [apiKey, model, provider, tasks, habits, events, period, interval])

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Resumen con IA</h3>
          <p className="text-xs text-gray-400">Tu asistente analiza lo que lograste</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {review ? (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review}</p>
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-gray-400 mb-4">
            Genera un resumen personalizado de todo lo que lograste {period === 'week' ? 'esta semana' : 'este mes'}.
          </p>
        )
      )}

      <Button onClick={generate} loading={loading} className="w-full">
        <Sparkles className="w-4 h-4" />
        {review ? 'Regenerar resumen' : 'Generar mi resumen'}
      </Button>
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [period, setPeriod] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  const tasks = useTasks()
  const habits = useHabits()
  const events = useEvents()

  const today = new Date()

  const interval = useMemo(() => {
    if (period === 'week') {
      const base = new Date(today)
      base.setDate(base.getDate() + weekOffset * 7)
      return {
        start: startOfWeek(base, { weekStartsOn: 1 }),
        end: endOfWeek(base, { weekStartsOn: 1 }),
      }
    } else {
      const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
      return { start: startOfMonth(base), end: endOfMonth(base) }
    }
  }, [period, weekOffset, monthOffset])

  const periodLabel = useMemo(() => {
    if (period === 'week') {
      return `${format(interval.start, "d 'de' MMM", { locale: es })} — ${format(interval.end, "d 'de' MMM", { locale: es })}`
    }
    return format(interval.start, 'MMMM yyyy', { locale: es })
  }, [period, interval])

  const offset = period === 'week' ? weekOffset : monthOffset
  const setOffset = period === 'week' ? setWeekOffset : setMonthOffset

  // ── Stats ──
  const completedTasks = useMemo(() =>
    tasks.data.filter((t) => {
      if (!t.completed) return false
      const d = parseDate(t.updatedAt)
      return d && inInterval(d, interval)
    }), [tasks.data, interval])

  const createdTasks = useMemo(() =>
    tasks.data.filter((t) => {
      const d = parseDate(t.createdAt)
      return d && inInterval(d, interval)
    }), [tasks.data, interval])

  const periodEvents = useMemo(() =>
    events.data.filter((e) => {
      const d = parseDate(e.startTime)
      return d && inInterval(d, interval)
    }), [events.data, interval])

  const habitRate = useMemo(() => {
    const dailyHabits = habits.data.filter((h) => h.frequency === 'daily')
    if (!dailyHabits.length) return null
    const days = eachDayOfInterval(interval)
    const expected = dailyHabits.length * days.length
    const done = dailyHabits.reduce((sum, h) => {
      return sum + (h.logs || []).filter((l) => {
        return l.completed && l.date >= format(interval.start, 'yyyy-MM-dd') && l.date <= format(interval.end, 'yyyy-MM-dd')
      }).length
    }, 0)
    return expected > 0 ? Math.round((done / expected) * 100) : 0
  }, [habits.data, interval])

  const maxStreak = useMemo(() =>
    Math.max(0, ...habits.data.map((h) => h.streak || 0)),
    [habits.data])

  // ── Daily chart data ──
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval(interval).slice(-14) // show up to 14 days
    return days.map((day) => ({
      label: format(day, 'dd/MM'),
      value: tasks.data.filter((t) => {
        if (!t.completed) return false
        const d = parseDate(t.updatedAt)
        if (!d) return false
        return format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      }).length,
    }))
  }, [tasks.data, interval])

  // ── Habit per-day completions for bar-within-card ──
  const habitBarData = useMemo(() =>
    habits.data.map((h) => {
      const days = eachDayOfInterval(interval).length
      const done = (h.logs || []).filter((l) => {
        return l.completed && l.date >= format(interval.start, 'yyyy-MM-dd') && l.date <= format(interval.end, 'yyyy-MM-dd')
      }).length
      const rate = h.frequency === 'daily' ? Math.round((done / days) * 100) : done
      return { name: h.name, color: h.color || '#6366f1', rate, done, streak: h.streak || 0 }
    }).sort((a, b) => b.rate - a.rate),
    [habits.data, interval])

  const loading = tasks.loading || habits.loading || events.loading

  const PRIORITY_COLORS = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-500' }
  const PRIORITY_LABELS = { high: 'Alta', medium: 'Media', low: 'Baja' }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Progreso
          </h1>
          <p className="text-sm text-gray-500 mt-1">Todo lo que has logrado, semana a semana</p>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-start">
          {[{ key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setPeriod(key); setWeekOffset(0); setMonthOffset(0) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800 capitalize">{periodLabel}</span>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Tareas completadas"
          value={loading ? '—' : completedTasks.length}
          sub={createdTasks.length > 0 ? `de ${createdTasks.length} creadas` : undefined}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Repeat}
          label="Cumplimiento de hábitos"
          value={loading ? '—' : habitRate !== null ? `${habitRate}%` : '—'}
          sub={habits.data.length > 0 ? `${habits.data.length} hábito${habits.data.length !== 1 ? 's' : ''}` : 'Sin hábitos'}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Flame}
          label="Racha más larga"
          value={loading ? '—' : `${maxStreak}d`}
          sub="racha activa"
          color="bg-orange-50 text-orange-500"
        />
        <StatCard
          icon={Calendar}
          label="Eventos"
          value={loading ? '—' : periodEvents.length}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wins — completed tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title={`Mis logros${completedTasks.length > 0 ? ` (${completedTasks.length})` : ''}`}>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 skeleton rounded-xl" />)}
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">Sin tareas completadas en este período</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {completedTasks.map((t) => (
                  <div
                    key={t._id || t.id}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-800 flex-1 leading-tight">{t.title}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {t.priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${PRIORITY_COLORS[t.priority] || 'bg-gray-100 text-gray-500'}`}>
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </span>
                      )}
                      {t.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">
                          {t.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Daily completion chart */}
          <Card title={`Tareas por día${period === 'month' ? ' (últimos 14 días)' : ''}`}>
            {loading ? (
              <div className="h-28 skeleton rounded-xl" />
            ) : (
              <DailyChart data={dailyData} />
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* AI review */}
          <AIReview
            tasks={tasks.data}
            habits={habits.data}
            events={events.data}
            period={period}
            interval={interval}
          />

          {/* Habit consistency */}
          <Card title="Consistencia de hábitos">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 skeleton rounded-lg" />)}
              </div>
            ) : habitBarData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin hábitos configurados</p>
            ) : (
              <div className="flex flex-col gap-3">
                {habitBarData.map((h) => (
                  <div key={h.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2">{h.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {h.streak > 0 && (
                          <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />{h.streak}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-600">
                          {h.rate}{typeof h.rate === 'number' && h.rate <= 100 ? '%' : ''}
                        </span>
                      </div>
                    </div>
                    <MiniBar value={h.rate} max={100} color={h.color} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Habit heatmap — last 90 days always */}
      <Card title="Mapa de hábitos — últimos 90 días">
        {habits.loading ? (
          <div className="h-20 skeleton rounded-xl" />
        ) : habits.data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin hábitos configurados</p>
        ) : (
          <>
            <HabitHeatmap habits={habits.data} />
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50">
              {habits.data.map((h) => (
                <div key={h._id || h.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color || '#6366f1' }} />
                  <span className="text-xs text-gray-500">{h.name}</span>
                  <span className="text-xs font-medium text-gray-700 ml-1">
                    {(h.logs || []).filter((l) => l.completed).length}d
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Trophy banner if great week */}
      {!loading && completedTasks.length >= 5 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">
              ¡{completedTasks.length} tareas completadas!
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Eso no es poco — cada tarea es progreso real. Sigue así.
            </p>
          </div>
          <Star className="w-5 h-5 text-amber-400 ml-auto flex-shrink-0" />
        </div>
      )}
    </div>
  )
}
