import { useState, useRef, useEffect } from 'react'
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Brain,
  Clock,
  Target,
  Heart,
  Send,
  MessageSquare,
  BarChart3,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import Button from '../ui/Button'

function readAiConfig() {
  const provider = localStorage.getItem('ai_provider') || 'openrouter'
  const apiKey =
    provider === 'gemini'
      ? localStorage.getItem('ai_gemini_key')
      : localStorage.getItem('ai_api_key')
  const model =
    provider === 'gemini'
      ? localStorage.getItem('ai_gemini_model')
      : localStorage.getItem('ai_model')
  return { provider, apiKey, model }
}

export default function AIAssistant({ isOpen, onClose, tasks, habits, events, routine = [] }) {
  const [mode, setMode] = useState('chat')
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const messagesEndRef = useRef(null)

  const today = new Date()
  const { provider, apiKey, model } = readAiConfig()
  const configured = !!apiKey && !!model

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const analyze = async () => {
    if (!configured) { setError('no_key'); return }
    setAnalyzeLoading(true)
    setError(null)
    setErrorMsg('')
    setAnalyzeResult(null)
    try {
      const todayStr = format(today, 'yyyy-MM-dd')
      const res = await client.post('/ai/suggest', {
        apiKey,
        model,
        provider,
        tasks: tasks.filter((t) => !t.completed),
        habits,
        events: events.filter((e) => e.startTime?.slice(0, 10) === todayStr),
        date: todayStr,
      })
      setAnalyzeResult(res.data)
    } catch (err) {
      setError('api_error')
      setErrorMsg(err.response?.data?.error || err.message || 'Error desconocido')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  const sendChat = async (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || chatLoading) return
    if (!configured) { setError('no_key'); return }

    const nextMessages = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)
    setError(null)
    setErrorMsg('')

    try {
      const res = await client.post('/ai/chat', {
        apiKey,
        model,
        provider,
        messages: nextMessages,
        context: { tasks, habits, events, routine },
      })
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      setError('api_error')
      setErrorMsg(err.response?.data?.error || err.message || 'Error desconocido')
      // Restore input so user can retry
      setChatInput(text)
      setChatMessages((prev) => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  const resetChat = () => {
    setChatMessages([])
    setError(null)
    setErrorMsg('')
  }

  if (!isOpen) return null

  const providerLabel = provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
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

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 mx-6 mt-4 bg-gray-100 rounded-xl">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setMode('analyze')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === 'analyze' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analizar día
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col">
          {!configured && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Configura tu API Key</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Ve a{' '}
                    <Link to="/settings" onClick={onClose} className="underline font-medium">
                      Configuración
                    </Link>{' '}
                    para elegir proveedor y modelo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error === 'api_error' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-red-700 mb-1">
                Error al conectar con {providerLabel}
              </p>
              {errorMsg && <p className="text-xs text-red-600 font-mono break-all">{errorMsg}</p>}
            </div>
          )}

          {mode === 'chat' && (
            <div className="flex-1 flex flex-col">
              {chatMessages.length === 0 && !chatLoading && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Pregunta lo que necesites</p>
                  <p className="text-xs mt-1">
                    Tengo contexto de tus tareas, hábitos, eventos y rutina.
                  </p>
                  <div className="flex flex-col gap-1.5 mt-4 text-xs">
                    {[
                      '¿Qué debería priorizar hoy?',
                      '¿Cómo voy con mis hábitos esta semana?',
                      '¿Tengo tareas atrasadas?',
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setChatInput(s)}
                        className="text-indigo-500 hover:text-indigo-700 underline decoration-dashed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.length > 0 && (
                <div className="flex flex-col gap-3 flex-1">
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white self-end rounded-br-md'
                          : 'bg-gray-100 text-gray-800 self-start rounded-bl-md whitespace-pre-wrap'
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-gray-100 text-gray-500 self-start rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {chatMessages.length > 0 && (
                <button
                  onClick={resetChat}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-3 self-start"
                >
                  Reiniciar conversación
                </button>
              )}
            </div>
          )}

          {mode === 'analyze' && (
            <>
              {/* Context summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {tasks.filter((t) => !t.completed).length}
                  </p>
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

              <Button onClick={analyze} loading={analyzeLoading} className="w-full mb-6">
                <Sparkles className="w-4 h-4" />
                Analizar mi día
              </Button>

              {analyzeLoading && (
                <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-sm">Analizando tu día...</p>
                </div>
              )}

              {analyzeResult && !analyzeLoading && (
                <div className="flex flex-col gap-4">
                  {analyzeResult.motivationalMessage && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                          Motivación
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {analyzeResult.motivationalMessage}
                      </p>
                    </div>
                  )}

                  {analyzeResult.dailySuggestion && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          Sugerencia del día
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {analyzeResult.dailySuggestion}
                      </p>
                    </div>
                  )}

                  {analyzeResult.priorityRecommendations?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-amber-500" />
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                          Prioridades
                        </p>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {analyzeResult.priorityRecommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-amber-500 font-bold mt-0.5">{i + 1}.</span>
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analyzeResult.timeBlocks?.length > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                          Bloques de tiempo
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {analyzeResult.timeBlocks.map((block, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5">
                              {block.time || block.startTime}
                            </span>
                            <span className="text-sm text-gray-700">
                              {block.activity || block.description || block.task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat input — only in chat mode */}
        {mode === 'chat' && configured && (
          <form onSubmit={sendChat} className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </>
  )
}
