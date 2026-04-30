import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTasks() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!user?.id) {
        setData([])
        return
      }
      const { data: rows, error: queryError } = await supabase
        .from('Task')
        .select('*')
        .order('createdAt', { ascending: false })
      if (queryError) throw queryError
      setData(rows || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const create = useCallback(async (taskData) => {
    const payload = { ...taskData, userId: user.id }
    const { data: created, error: createError } = await supabase
      .from('Task')
      .insert(payload)
      .select()
      .single()
    if (createError) throw createError
    setData((prev) => [created, ...prev])
    return created
  }, [user?.id])

  const update = useCallback(async (id, taskData) => {
    const { data: updated, error: updateError } = await supabase
      .from('Task')
      .update(taskData)
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setData((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('Task').delete().eq('id', id)
    if (deleteError) throw deleteError
    setData((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggle = useCallback(async (id, completed) => {
    const { data: updated, error: toggleError } = await supabase
      .from('Task')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()
    if (toggleError) throw toggleError
    setData((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  return { data, loading, error, refetch: fetchTasks, create, update, delete: remove, toggle }
}
