import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useHabits() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!user?.id) {
        setData([])
        return
      }
      const { data: habits, error: habitsError } = await supabase
        .from('Habit')
        .select('*')
        .order('createdAt', { ascending: false })
      if (habitsError) throw habitsError

      const habitIds = (habits || []).map((h) => h.id)
      if (!habitIds.length) {
        setData([])
        return
      }
      const { data: logs, error: logsError } = await supabase
        .from('HabitLog')
        .select('*')
        .in('habitId', habitIds)
      if (logsError) throw logsError

      const logMap = new Map()
      for (const log of logs || []) {
        const list = logMap.get(log.habitId) || []
        list.push(log)
        logMap.set(log.habitId, list)
      }
      setData((habits || []).map((h) => ({ ...h, logs: logMap.get(h.id) || [] })))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const create = useCallback(async (habitData) => {
    const payload = { ...habitData, userId: user.id }
    const { data: created, error: createError } = await supabase
      .from('Habit')
      .insert(payload)
      .select()
      .single()
    if (createError) throw createError
    const item = { ...created, logs: [] }
    setData((prev) => [item, ...prev])
    return item
  }, [user?.id])

  const update = useCallback(async (id, habitData) => {
    const { data: updated, error: updateError } = await supabase
      .from('Habit')
      .update(habitData)
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setData((prev) => prev.map((h) => (h.id === id ? { ...updated, logs: h.logs || [] } : h)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('Habit').delete().eq('id', id)
    if (deleteError) throw deleteError
    setData((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const checkIn = useCallback(async (id, date) => {
    const { error: upsertError } = await supabase.from('HabitLog').upsert(
      { habitId: id, date, completed: true },
      { onConflict: 'habitId,date' }
    )
    if (upsertError) throw upsertError
    await fetchHabits()
    return { ok: true }
  }, [fetchHabits])

  return { data, loading, error, refetch: fetchHabits, create, update, delete: remove, checkIn }
}
