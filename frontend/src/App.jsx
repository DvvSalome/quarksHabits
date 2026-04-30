import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Habits from './pages/Habits'
import Calendar from './pages/Calendar'
import Routine from './pages/Routine'
import Settings from './pages/Settings'
import Progress from './pages/Progress'
import Content from './pages/Content'
import BootSequence from './components/ui/BootSequence'
import Login from './pages/Login'

export default function App() {
  const { isAuthenticated, loading } = useAuth()
  const [booting, setBooting] = useState(() => {
    // Check if we've already booted this session to avoid annoyance
    return !sessionStorage.getItem('jarvis_booted')
  })

  const handleBootComplete = () => {
    sessionStorage.setItem('jarvis_booted', 'true')
    setBooting(false)
  }

  if (loading) return null

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <>
      <AnimatePresence>
        {booting && <BootSequence key="boot" onComplete={handleBootComplete} />}
      </AnimatePresence>

      {!booting && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="habits" element={<Habits />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="routine" element={<Routine />} />
            <Route path="progress" element={<Progress />} />
            <Route path="content" element={<Content />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      )}
    </>
  )
}
