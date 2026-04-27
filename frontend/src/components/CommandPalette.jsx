import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, CheckSquare, Repeat, Calendar, Clock, Settings,
  TrendingUp, Sparkles, Timer, Sun, Moon, FileText, X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'

const COMMANDS = [
  { id: 'go-dashboard', label: 'Ir al Dashboard', icon: LayoutDashboard, group: 'Navegación', shortcut: 'g d', action: (nav) => nav('/dashboard') },
  { id: 'go-tasks', label: 'Ir a Tareas', icon: CheckSquare, group: 'Navegación', shortcut: 'g t', action: (nav) => nav('/tasks') },
  { id: 'go-habits', label: 'Ir a Hábitos', icon: Repeat, group: 'Navegación', shortcut: 'g h', action: (nav) => nav('/habits') },
  { id: 'go-calendar', label: 'Ir al Calendario', icon: Calendar, group: 'Navegación', shortcut: 'g c', action: (nav) => nav('/calendar') },
  { id: 'go-routine', label: 'Ir a Plan de mañana', icon: Clock, group: 'Navegación', shortcut: 'g r', action: (nav) => nav('/routine') },
  { id: 'go-progress', label: 'Ir a Progreso', icon: TrendingUp, group: 'Navegación', shortcut: 'g p', action: (nav) => nav('/progress') },
  { id: 'go-content', label: 'Generador de contenido', icon: FileText, group: 'Navegación', shortcut: 'g x', action: (nav) => nav('/content') },
  { id: 'go-settings', label: 'Configuración', icon: Settings, group: 'Navegación', shortcut: ',', action: (nav) => nav('/settings') },
  { id: 'pomodoro', label: 'Iniciar Pomodoro', icon: Timer, group: 'Acciones', shortcut: 'p', action: (_, app) => app.startPomodoro() },
  { id: 'theme', label: 'Cambiar tema (claro/oscuro)', icon: Sun, group: 'Acciones', shortcut: 't', action: (_, app) => app.toggleTheme() },
]

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, ...app } = useApp()
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.shortcut.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [paletteOpen])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  const runCommand = (cmd) => {
    setPaletteOpen(false)
    cmd.action(navigate, app)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setPaletteOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIdx]) runCommand(filtered[selectedIdx])
    }
  }

  if (!paletteOpen) return null

  // Group commands
  const groups = {}
  filtered.forEach((c) => {
    if (!groups[c.group]) groups[c.group] = []
    groups[c.group].push(c)
  })

  let runningIdx = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/30"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comando..."
            className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin resultados</p>
          ) : (
            Object.entries(groups).map(([group, cmds]) => (
              <div key={group} className="mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-1">
                  {group}
                </p>
                {cmds.map((cmd) => {
                  const idx = runningIdx++
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        idx === selectedIdx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${idx === selectedIdx ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={`text-sm flex-1 ${idx === selectedIdx ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {cmd.label}
                      </span>
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {cmd.shortcut}
                      </kbd>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> Navegar</span>
            <span><kbd className="bg-gray-100 px-1 rounded">⏎</kbd> Ejecutar</span>
          </div>
          <span>⌘K para abrir</span>
        </div>
      </div>
    </div>
  )
}
