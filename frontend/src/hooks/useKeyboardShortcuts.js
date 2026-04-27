import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const SEQUENCE_TIMEOUT = 1000

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { setPaletteOpen, startPomodoro, toggleTheme, paletteOpen } = useApp()
  const sequenceRef = useRef('')
  const timeoutRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      // Ignore if typing in input/textarea or modal is open
      const target = e.target
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Cmd+K / Ctrl+K — always works (even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Esc — close palette
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false)
        return
      }

      // Don't process other shortcuts in inputs
      if (isInput) return

      // Single-key shortcuts
      if (e.key === '/' || e.key === '?') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // 'n' for new task — only when not in sequence
      if (sequenceRef.current === '' && e.key === 'n') {
        e.preventDefault()
        // Trigger custom event that pages can listen to
        window.dispatchEvent(new CustomEvent('shortcut:new-task'))
        return
      }

      // 'p' for pomodoro
      if (sequenceRef.current === '' && e.key === 'p') {
        e.preventDefault()
        startPomodoro()
        return
      }

      // 't' for theme toggle
      if (sequenceRef.current === '' && e.key === 't') {
        e.preventDefault()
        toggleTheme()
        return
      }

      // ',' for settings
      if (e.key === ',' && sequenceRef.current === '') {
        e.preventDefault()
        navigate('/settings')
        return
      }

      // Sequence shortcuts: g d/t/h/c/r/p/x
      if (e.key === 'g' && sequenceRef.current === '') {
        sequenceRef.current = 'g'
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          sequenceRef.current = ''
        }, SEQUENCE_TIMEOUT)
        return
      }

      if (sequenceRef.current === 'g') {
        clearTimeout(timeoutRef.current)
        sequenceRef.current = ''
        const map = {
          d: '/dashboard',
          t: '/tasks',
          h: '/habits',
          c: '/calendar',
          r: '/routine',
          p: '/progress',
          x: '/content',
          s: '/settings',
        }
        if (map[e.key]) {
          e.preventDefault()
          navigate(map[e.key])
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(timeoutRef.current)
    }
  }, [navigate, setPaletteOpen, startPomodoro, toggleTheme, paletteOpen])
}
