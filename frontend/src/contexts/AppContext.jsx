import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }) {
  // Pomodoro
  const [pomodoroOpen, setPomodoroOpen] = useState(false)
  const [pomodoroTask, setPomodoroTask] = useState(null)

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const startPomodoro = (task = null) => {
    setPomodoroTask(task)
    setPomodoroOpen(true)
  }

  const closePomodoro = () => {
    setPomodoroOpen(false)
    setPomodoroTask(null)
  }

  return (
    <AppContext.Provider
      value={{
        pomodoroOpen,
        pomodoroTask,
        startPomodoro,
        closePomodoro,
        paletteOpen,
        setPaletteOpen,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
