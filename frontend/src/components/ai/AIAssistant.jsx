import { useState } from 'react'
import { X, Sparkles, Loader2, AlertCircle, Brain, Clock, Target, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import Button from '../ui/Button'

export default function AIAssistant({ isOpen, onClose, tasks, habits, events }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const apiKey = localStorage.getItem('ai_api_key')
  const aiModel = localStorage.getItem('ai_model')
  const today = new Date()

  const analyze = async () => {
    if (!apiKey || !aiModel) {
      setError('no_key')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const todayStr = format(today, 'yyyy-MM-dd')
      const todayTasks = tasks.filter((t) => !t.completed)
      const todayHabits = habits
      const todayEvents = events.filter((e) => {
        if (!e.startTime) return false
        return e.startTime.slice(0, 10) === todayStr
      })

      const res = await client.post('/ai/suggest', {
        apiKey,
        model: aiModel,
        tasks: todayTasks,
        habits: todayHabits,
        events: todayEvents,
        date: todayStr,
      })
      setResult(res.data)
    } catch (err) {
      setError('api_error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Asistente IA</h2>
              <p className="text-xs text-gray-400 capitalize">
                {format(today, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(!apiKey || !aiModel) && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {!apiKey ? 'API Key no configurada' : 'Modelo no especificado'}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Configura tu API Key de OpenRouter y el modelo en{' '}
                    <Link to="/settings" onClick={onClose} className="underline font-medium">
                      Configuración
                    </Link>
                    {' '}para usar el asistente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error === 'api_error' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-700">Error al conectar con la IA. Verifica tu API Key y vuelve a intentarlo.</p>
            </div>
          )}

          {/* Context summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{tasks.filter((t) => !t.completed).length}</p>
              <p className="text-xs text-gray-400">Tareas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{habits.length}</p>
              <p className="text-xs text-gray-400">Hábitos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{events.length}</p>
              <p className="text-xs text-gray-400">Eventos</p>
            </div>
          </div>

          {/* Analyze button */}
          <Button
            onClick={analyze}
            loading={loading}
            className="w-full mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Analizar mi día
          </Button>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Analizando tu día...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex flex-col gap-4">
              {result.motivationalMessage && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-indigo-500" />
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Motivación</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.motivationalMessage}</p>
                </div>
              )}

              {result.dailySuggestion && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Sugerencia del día</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.dailySuggestion}</p>
                </div>
              )}

              {result.priorityRecommendations && result.priorityRecommendations.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Prioridades</p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {result.priorityRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-amber-500 font-bold mt-0.5">{i + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.timeBlocks && result.timeBlocks.length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Bloques de tiempo</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {result.timeBlocks.map((block, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5">
                          {block.time || block.startTime}
                        </span>
                        <span className="text-sm text-gray-700">{block.activity || block.description || block.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
