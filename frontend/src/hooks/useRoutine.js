import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useRoutine({ planDate } = {}) {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoutine = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!user?.id) {
        setData([])
        return
      }
      let query = supabase.from('RoutineBlock').select('*')
      if (planDate) query = query.eq('planDate', planDate)
      const { data: rows, error: queryError } = await query.order('startTime', { ascending: true })
      if (queryError) throw queryError
      setData(rows || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [planDate, user?.id])

  useEffect(() => {
    fetchRoutine()
  }, [fetchRoutine])

  const create = useCallback(async (blockData) => {
    const payload = planDate ? { ...blockData, planDate, userId: user.id } : { ...blockData, userId: user.id }
    const { data: created, error: createError } = await supabase
      .from('RoutineBlock')
      .insert(payload)
      .select()
      .single()
    if (createError) throw createError
    setData((prev) => [...prev, created].sort((a, b) => {
      const aTime = a.startTime || ''
      const bTime = b.startTime || ''
      return aTime.localeCompare(bTime)
    }))
    return created
  }, [planDate, user?.id])

  const update = useCallback(async (id, blockData) => {
    const { data: updated, error: updateError } = await supabase
      .from('RoutineBlock')
      .update(blockData)
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setData((prev) =>
      prev.map((b) => (b.id === id ? updated : b))
        .sort((a, b) => {
          const aTime = a.startTime || ''
          const bTime = b.startTime || ''
          return aTime.localeCompare(bTime)
        })
    )
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('RoutineBlock').delete().eq('id', id)
    if (deleteError) throw deleteError
    setData((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const toggleComplete = useCallback(async (id, completed) => {
    const { data: updated, error: toggleError } = await supabase
      .from('RoutineBlock')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()
    if (toggleError) throw toggleError
    setData((prev) => prev.map((b) => (b.id === id ? updated : b)))
    return updated
  }, [])

  return { data, loading, error, refetch: fetchRoutine, create, update, delete: remove, toggleComplete }
}
