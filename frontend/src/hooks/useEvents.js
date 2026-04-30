import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useEvents() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!user?.id) {
        setData([])
        return
      }
      const { data: rows, error: queryError } = await supabase
        .from('Event')
        .select('*')
        .order('startTime', { ascending: true })
      if (queryError) throw queryError
      setData(rows || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const create = useCallback(async (eventData) => {
    const payload = { ...eventData, userId: user.id }
    const { data: created, error: createError } = await supabase
      .from('Event')
      .insert(payload)
      .select()
      .single()
    if (createError) throw createError
    setData((prev) => [...prev, created].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')))
    return created
  }, [user?.id])

  const update = useCallback(async (id, eventData) => {
    const { data: updated, error: updateError } = await supabase
      .from('Event')
      .update(eventData)
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setData((prev) =>
      prev.map((e) => (e.id === id ? updated : e)).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    )
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('Event').delete().eq('id', id)
    if (deleteError) throw deleteError
    setData((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { data, loading, error, refetch: fetchEvents, create, update, delete: remove }
}
