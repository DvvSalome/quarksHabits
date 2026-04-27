import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Calendar,
  Clock,
  Settings,
  Sparkles,
  TrendingUp,
  FileText,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
  { to: '/habits', icon: Repeat, label: 'Hábitos' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/routine', icon: Clock, label: 'Rutina' },
  { to: '/progress', icon: TrendingUp, label: 'Progreso' },
  { to: '/content', icon: FileText, label: 'Contenido' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-950 border-r border-cyan-900/30 flex flex-col relative overflow-hidden">
      {/* Decorative side line */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-50" />
      
      {/* Logo */}
      <div className="px-6 py-6 border-b border-cyan-900/30 relative">
        <div className="absolute inset-0 bg-cyan-900/10 blur-xl rounded-full" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 border border-cyan-400 bg-cyan-950/50 rounded-lg flex items-center justify-center glow-border relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
            <Sparkles className="w-5 h-5 text-cyan-400 z-10" />
          </div>
          <div>
            <span className="block text-xl font-bold text-cyan-50 tracking-widest glow-text">ASISTENTE</span>
            <span className="block text-[10px] text-cyan-500 font-mono tracking-widest uppercase mt-0.5">Core System v4.1</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                isActive
                  ? 'bg-cyan-900/20 text-cyan-300 border border-cyan-500/30 glow-border shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-cyan-100 hover:border-cyan-900/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400 glow-text' : 'text-slate-500 group-hover:text-cyan-300'}`} />
                <span className="tracking-wide uppercase text-xs">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-cyan-900/30">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group ${
              isActive
                ? 'bg-cyan-900/20 text-cyan-300 border border-cyan-500/30 glow-border'
                : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-cyan-100 hover:border-cyan-900/50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
              )}
              <Settings className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400 glow-text' : 'text-slate-500 group-hover:text-cyan-300'}`} />
              <span className="tracking-wide uppercase text-xs">Configuración</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
