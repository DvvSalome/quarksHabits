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

      // Compatibility path: older Supabase schemas do not have HabitLog.comment yet.
      // Comments are mirrored in Content so daily details work before/without a DB migration.
      const { data: commentRows, error: commentsError } = await supabase
        .from('Content')
        .select('topic,body')
        .eq('templateType', 'habit-log-comment')
      if (commentsError) throw commentsError

      const commentMap = new Map()
      for (const row of commentRows || []) {
        commentMap.set(row.topic, row.body)
      }

      const logMap = new Map()
      for (const log of logs || []) {
        const comment = log.comment || commentMap.get(`${log.habitId}:${log.date}`) || ''
        const list = logMap.get(log.habitId) || []
        list.push({ ...log, comment })
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
    const payload = { id: crypto.randomUUID(), ...habitData, userId: user.id }
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

  const saveCommentFallback = useCallback(async (id, date, comment) => {
    if (!user?.id || !comment) return
    const { error } = await supabase.from('Content').upsert({
      id: `habit-comment:${id}:${date}`,
      userId: user.id,
      templateType: 'habit-log-comment',
      topic: `${id}:${date}`,
      body: comment,
    })
    if (error) throw error
  }, [user?.id])

  const checkIn = useCallback(async (id, date, comment = '') => {
    const trimmedComment = typeof comment === 'string' ? comment.trim() : ''
    const payload = {
      id: `${id}:${date}`,
      habitId: id,
      date,
      completed: true,
    }

    if (trimmedComment) payload.comment = trimmedComment

    let savedFallbackComment = false
    const { error: upsertError } = await supabase.from('HabitLog').upsert(
      payload,
      { onConflict: 'habitId,date' }
    )
    if (upsertError?.code === 'PGRST204' && 'comment' in payload) {
      delete payload.comment
      const { error: retryError } = await supabase.from('HabitLog').upsert(
        payload,
        { onConflict: 'habitId,date' }
      )
      if (retryError) throw retryError
      await saveCommentFallback(id, date, trimmedComment)
      savedFallbackComment = true
    } else if (upsertError) {
      throw upsertError
    }

    if (trimmedComment && !savedFallbackComment) await saveCommentFallback(id, date, trimmedComment)
    await fetchHabits()
    return { ok: true }
  }, [fetchHabits, saveCommentFallback])

  return { data, loading, error, refetch: fetchHabits, create, update, delete: remove, checkIn }
}
