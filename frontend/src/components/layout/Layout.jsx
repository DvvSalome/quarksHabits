import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import PomodoroWidget from '../pomodoro/PomodoroWidget'
import CommandPalette from '../CommandPalette'
import { useApp } from '../../contexts/AppContext'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export default function Layout() {
  const { pomodoroOpen, pomodoroTask, closePomodoro } = useApp()

  // Activate global keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <div className="flex min-h-screen bg-slate-950 text-cyan-50 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />

      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Global overlays */}
      {pomodoroOpen && (
        <PomodoroWidget activeTask={pomodoroTask} onClose={closePomodoro} />
      )}
      <CommandPalette />
    </div>
  )
}
