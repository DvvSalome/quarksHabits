import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function useHabits() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await client.get('/habits')
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const create = useCallback(async (habitData) => {
    const res = await client.post('/habits', habitData)
    setData((prev) => [...prev, res.data])
    return res.data
  }, [])

  const update = useCallback(async (id, habitData) => {
    const res = await client.put(`/habits/${id}`, habitData)
    setData((prev) => prev.map((h) => (h._id === id || h.id === id ? res.data : h)))
    return res.data
  }, [])

  const remove = useCallback(async (id) => {
    await client.delete(`/habits/${id}`)
    setData((prev) => prev.filter((h) => h._id !== id && h.id !== id))
  }, [])

  const checkIn = useCallback(async (id, date) => {
    const res = await client.post(`/habits/${id}/log`, { date, completed: true })
    await fetchHabits()
    return res.data
  }, [fetchHabits])

  return { data, loading, error, refetch: fetchHabits, create, update, delete: remove, checkIn }
}
