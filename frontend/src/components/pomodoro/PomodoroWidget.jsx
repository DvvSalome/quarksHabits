import { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, Coffee, Timer, RotateCcw } from 'lucide-react'

const WORK_DURATION = 25 * 60 // 25 min
const BREAK_DURATION = 5 * 60 // 5 min

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getTodayCount() {
  try {
    const data = JSON.parse(localStorage.getItem('pomodoro_count') || '{}')
    const today = new Date().toISOString().slice(0, 10)
    return data[today] || 0
  } catch { return 0 }
}

function incrementTodayCount() {
  try {
    const data = JSON.parse(localStorage.getItem('pomodoro_count') || '{}')
    const today = new Date().toISOString().slice(0, 10)
    data[today] = (data[today] || 0) + 1
    localStorage.setItem('pomodoro_count', JSON.stringify(data))
    return data[today]
  } catch { return 0 }
}

export default function PomodoroWidget({ activeTask, onClose }) {
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [todayCount, setTodayCount] = useState(getTodayCount())
  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer ended
            playSound()
            if (mode === 'work') {
              const newCount = incrementTodayCount()
              setTodayCount(newCount)
              setMode('break')
              notifyEnd('¡Pomodoro completado! Hora de descansar.')
              return BREAK_DURATION
            } else {
              setMode('work')
              notifyEnd('Descanso terminado. Volvamos al trabajo.')
              return WORK_DURATION
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, mode])

  const playSound = () => {
    try {
      // Beep using Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  const notifyEnd = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro', { body: message, icon: '/favicon.ico' })
    }
  }

  const reset = () => {
    setIsRunning(false)
    setSecondsLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION)
  }

  const switchMode = (newMode) => {
    setIsRunning(false)
    setMode(newMode)
    setSecondsLeft(newMode === 'work' ? WORK_DURATION : BREAK_DURATION)
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const totalSeconds = mode === 'work' ? WORK_DURATION : BREAK_DURATION
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const isWork = mode === 'work'

  return (
    <div className="fixed bottom-6 left-6 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWork ? (
            <Timer className="w-4 h-4 text-red-500" />
          ) : (
            <Coffee className="w-4 h-4 text-green-500" />
          )}
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {isWork ? 'Trabajo' : 'Descanso'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active task */}
      {activeTask && isWork && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
          {activeTask.activity}
        </p>
      )}

      {/* Timer */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold font-mono text-gray-900 tabular-nums">
          {formatTime(secondsLeft)}
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${isWork ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setIsRunning((r) => !r)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isWork
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isRunning ? (
            <><Pause className="w-3.5 h-3.5" /> Pausar</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Iniciar</>
          )}
        </button>
        <button
          onClick={reset}
          className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg mb-3">
        <button
          onClick={() => switchMode('work')}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
            isWork ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Trabajo (25)
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
            !isWork ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Descanso (5)
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Hoy:</span>
        <span className="font-semibold text-gray-700">
          {todayCount} pomodoro{todayCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
