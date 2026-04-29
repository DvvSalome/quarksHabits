import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import PomodoroWidget from '../pomodoro/PomodoroWidget'
import CommandPalette from '../CommandPalette'
import { useApp } from '../../contexts/AppContext'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export default function Layout() {
  const { pomodoroOpen, pomodoroTask, closePomodoro } = useApp()

  useKeyboardShortcuts()

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-white/95">
      {/* ── Geometric square grid background ── */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        {/* Base grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(109,40,217,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,0.065) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Dot accent at grid intersections */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(109,40,217,0.12) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Radial fade: white center so it doesn't feel overwhelming */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 65% at 55% 40%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)',
          }}
        />

        {/* Very subtle violet ambient top-left corner glow */}
        <div
          className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-20 animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 65%)',
          }}
        />
        {/* Bottom-right accent */}
        <div
          className="absolute -bottom-32 -right-32 w-[360px] h-[360px] rounded-full opacity-15 animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, transparent 65%)',
            animationDelay: '3s',
          }}
        />
      </div>

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>

      {pomodoroOpen && (
        <PomodoroWidget activeTask={pomodoroTask} onClose={closePomodoro} />
      )}
      <CommandPalette />
    </div>
  )
}
