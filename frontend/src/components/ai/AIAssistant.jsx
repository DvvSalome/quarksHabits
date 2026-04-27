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
  Terminal
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
      setErrorMsg(err.response?.data?.error || err.message || 'Unknown Protocol Error')
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
      setErrorMsg(err.response?.data?.error || err.message || 'Unknown Protocol Error')
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-slate-900/90 backdrop-blur-md border-l border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)] z-50 flex flex-col"
          >
            {/* Ambient side glow */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)]" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-900/50 bg-slate-900/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-cyan-400/50 bg-cyan-950 rounded-lg flex items-center justify-center glow-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                  <Terminal className="w-5 h-5 text-cyan-400 z-10" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-cyan-50 tracking-widest glow-text uppercase">Asistente IA</h2>
                  <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">
                    System Link Active
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-cyan-500/70 hover:text-cyan-300 hover:bg-cyan-900/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 mx-6 mt-5 bg-slate-950 border border-cyan-900/30 rounded-xl relative z-10">
              <button
                onClick={() => setMode('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono tracking-wider transition-all uppercase ${
                  mode === 'chat' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 glow-border' : 'text-slate-500 hover:text-cyan-400/70 border border-transparent'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comms
              </button>
              <button
                onClick={() => setMode('analyze')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono tracking-wider transition-all uppercase ${
                  mode === 'analyze' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 glow-border' : 'text-slate-500 hover:text-cyan-400/70 border border-transparent'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analysis
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col relative z-10">
              {!configured && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-400 font-mono tracking-wider uppercase">API UPLINK OFFLINE</p>
                      <p className="text-xs text-red-500/80 mt-1 font-mono">
                        Access{' '}
                        <Link to="/settings" onClick={onClose} className="text-red-400 underline underline-offset-2">
                          Settings
                        </Link>{' '}
                        to configure neural net provider.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error === 'api_error' && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-5">
                  <p className="text-sm font-bold text-red-400 mb-1 font-mono tracking-wider uppercase">
                    CONNECTION ERROR
                  </p>
                  {errorMsg && <p className="text-xs text-red-500/80 font-mono break-all">{errorMsg}</p>}
                </div>
              )}

              {mode === 'chat' && (
                <div className="flex-1 flex flex-col">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center py-10 text-cyan-500/50">
                      <div className="w-16 h-16 rounded-full border border-cyan-500/30 mx-auto flex items-center justify-center mb-4 relative glow-border">
                        <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                        <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                      </div>
                      <p className="text-sm font-mono tracking-widest uppercase text-cyan-300 glow-text mb-2">Systems Online</p>
                      <p className="text-xs font-mono text-cyan-500/60 mb-6">Awaiting command inputs. Accessing task databanks.</p>
                      
                      <div className="flex flex-col gap-2 text-xs">
                        {[
                          '¿Qué debería priorizar hoy?',
                          '¿Cómo voy con mis hábitos esta semana?',
                          '¿Tengo tareas atrasadas?',
                        ].map((s) => (
                          <button
                            key={s}
                            onClick={() => setChatInput(s)}
                            className="bg-slate-900/50 border border-cyan-900/50 p-3 rounded-lg text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-500/50 hover:glow-text transition-all font-mono text-left"
                          >
                            > {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.length > 0 && (
                    <div className="flex flex-col gap-4 flex-1">
                      {chatMessages.map((m, i) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={i}
                          className={`max-w-[90%] rounded-xl p-3.5 text-sm leading-relaxed font-mono ${
                            m.role === 'user'
                              ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-100 self-end rounded-br-none shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                              : 'bg-slate-800/80 border border-slate-700 text-cyan-50 self-start rounded-bl-none whitespace-pre-wrap shadow-lg'
                          }`}
                        >
                          {m.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Asistente Response</span>
                            </div>
                          )}
                          {m.content}
                        </motion.div>
                      ))}
                      {chatLoading && (
                        <div className="bg-slate-800/80 border border-slate-700 text-cyan-500 self-start rounded-xl rounded-bl-none p-4 text-sm font-mono flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span className="animate-pulse">Processing...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {chatMessages.length > 0 && (
                    <button
                      onClick={resetChat}
                      className="text-xs font-mono tracking-widest uppercase text-slate-500 hover:text-red-400 hover:glow-text mt-4 self-start flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3 h-3" /> Clear Buffer
                    </button>
                  )}
                </div>
              )}

              {mode === 'analyze' && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-900/50 border border-cyan-900/30 rounded-xl p-3 text-center glow-border">
                      <p className="text-xl font-bold text-cyan-300 font-mono glow-text">
                        {tasks.filter((t) => !t.completed).length}
                      </p>
                      <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mt-1">Directives</p>
                    </div>
                    <div className="bg-slate-900/50 border border-cyan-900/30 rounded-xl p-3 text-center glow-border">
                      <p className="text-xl font-bold text-cyan-300 font-mono glow-text">{habits.length}</p>
                      <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mt-1">Protocols</p>
                    </div>
                    <div className="bg-slate-900/50 border border-cyan-900/30 rounded-xl p-3 text-center glow-border">
                      <p className="text-xl font-bold text-cyan-300 font-mono glow-text">{events.length}</p>
                      <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mt-1">Events</p>
                    </div>
                  </div>

                  <button 
                    onClick={analyze} 
                    disabled={analyzeLoading}
                    className="w-full mb-6 py-3 bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 font-mono uppercase tracking-widest text-sm rounded-xl hover:bg-cyan-800/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-border"
                  >
                    {analyzeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Brain className="w-4 h-4 text-cyan-400" />
                    )}
                    {analyzeLoading ? 'Executing Analysis...' : 'Initiate Full Scan'}
                  </button>

                  {analyzeResult && !analyzeLoading && (
                    <div className="flex flex-col gap-4 font-mono">
                      {analyzeResult.motivationalMessage && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-4 h-4 text-indigo-400" />
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                              System Encouragement
                            </p>
                          </div>
                          <p className="text-sm text-indigo-100/80 leading-relaxed">
                            {analyzeResult.motivationalMessage}
                          </p>
                        </motion.div>
                      )}

                      {analyzeResult.dailySuggestion && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-blue-400" />
                            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                              Tactical Advice
                            </p>
                          </div>
                          <p className="text-sm text-blue-100/80 leading-relaxed">
                            {analyzeResult.dailySuggestion}
                          </p>
                        </motion.div>
                      )}

                      {analyzeResult.priorityRecommendations?.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-amber-400" />
                            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                              Primary Targets
                            </p>
                          </div>
                          <ul className="flex flex-col gap-3">
                            {analyzeResult.priorityRecommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-amber-100/80">
                                <span className="text-amber-500 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">{i + 1}</span>
                                <span className="leading-relaxed mt-0.5">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {analyzeResult.timeBlocks?.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-green-950/30 border border-green-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-green-400" />
                            <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">
                              Optimized Timeline
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {analyzeResult.timeBlocks.map((block, i) => (
                              <div key={i} className="flex items-start gap-3 p-2 hover:bg-green-900/20 rounded transition-colors border border-transparent hover:border-green-500/20">
                                <span className="text-xs font-mono text-green-400 bg-green-950/80 border border-green-500/30 px-2 py-1 rounded flex-shrink-0">
                                  {block.time || block.startTime}
                                </span>
                                <span className="text-sm text-green-100/80 mt-0.5">
                                  {block.activity || block.description || block.task}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat input */}
            {mode === 'chat' && configured && (
              <form onSubmit={sendChat} className="p-4 border-t border-cyan-900/50 bg-slate-900/80 flex gap-2 relative z-10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="> Enter command sequence..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-cyan-900/50 rounded-xl text-sm font-mono text-cyan-50 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-3 bg-cyan-900/40 border border-cyan-500/50 text-cyan-300 rounded-xl hover:bg-cyan-800/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center glow-border"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
