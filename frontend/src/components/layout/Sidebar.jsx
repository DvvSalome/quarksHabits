import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Calendar,
  Clock,
  Settings,
  TrendingUp,
  FileText,
  Zap,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
  { to: '/habits', icon: Repeat, label: 'Hábitos' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/routine', icon: Clock, label: 'Rutina' },
  { to: '/progress', icon: TrendingUp, label: 'Progreso' },
  { to: '/content', icon: FileText, label: 'Contenido' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const displayName = user?.user_metadata?.name || user?.email || 'Usuario'

  return (
    <aside
      className="w-56 min-h-screen flex flex-col sticky top-0 h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, #0d0720 0%, #160c3a 45%, #0c1030 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.14)',
        boxShadow: '4px 0 40px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Ambient glow decorations */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden">
        <div
          className="absolute -top-28 -left-28 w-64 h-64 rounded-full opacity-30 animate-float-slow"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.7), transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 -right-16 w-44 h-44 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent 65%)' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Logo */}
      <div
        className="relative px-5 py-5"
        style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 20, scale: 1.18 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shimmer-sweep"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 22px rgba(124,58,237,0.65), 0 4px 14px rgba(0,0,0,0.4)',
            }}
          >
            <Zap className="w-4 h-4 text-white relative z-10" />
          </motion.div>

          <span
            className="text-[14px] font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 60%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            QuarkHabits
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto relative">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="block">
            {({ isActive }) => (
              <motion.div
                whileHover={!isActive ? { x: 3 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={
                  isActive
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(124,58,237,0.38), rgba(168,85,247,0.18))',
                        border: '1px solid rgba(139,92,246,0.28)',
                        boxShadow:
                          'inset 0 0 20px rgba(124,58,237,0.1), 0 4px 14px rgba(124,58,237,0.18)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                {/* Hover bg for inactive items */}
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                )}

                {/* Icon with active glow */}
                <div className="relative flex-shrink-0 w-4 h-4">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-violet-300' : 'text-slate-500'
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 blur-sm rounded-full"
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ background: 'rgba(167,139,250,0.5)' }}
                    />
                  )}
                </div>

                <span className="flex-1">{label}</span>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-dot"
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        background: '#a78bfa',
                        boxShadow: '0 0 8px rgba(167,139,250,0.9)',
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div
        className="relative px-3 py-3"
        style={{ borderTop: '1px solid rgba(139, 92, 246, 0.12)' }}
      >
        <div className="px-3 pb-3">
          <p className="text-xs text-slate-400 truncate">{displayName}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
        </div>
        <NavLink to="/settings" className="block">
          {({ isActive }) => (
            <motion.div
              whileHover={!isActive ? { x: 3 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(124,58,237,0.38), rgba(168,85,247,0.18))',
                      border: '1px solid rgba(139,92,246,0.28)',
                    }
                  : { border: '1px solid transparent' }
              }
            >
              <Settings
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-violet-300' : 'text-slate-500'
                }`}
              />
              <span>Configuración</span>
            </motion.div>
          )}
        </NavLink>
        <button
          type="button"
          onClick={logout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  )
}
