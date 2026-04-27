import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function useRoutine({ planDate } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoutine = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = planDate ? `?planDate=${planDate}` : ''
      const res = await client.get(`/routine${params}`)
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [planDate])

  useEffect(() => {
    fetchRoutine()
  }, [fetchRoutine])

  const create = useCallback(async (blockData) => {
    const payload = planDate ? { ...blockData, planDate } : blockData
    const res = await client.post('/routine', payload)
    setData((prev) => [...prev, res.data].sort((a, b) => {
      const aTime = a.startTime || ''
      const bTime = b.startTime || ''
      return aTime.localeCompare(bTime)
    }))
    return res.data
  }, [planDate])

  const update = useCallback(async (id, blockData) => {
    const res = await client.put(`/routine/${id}`, blockData)
    setData((prev) =>
      prev.map((b) => (b._id === id || b.id === id ? res.data : b))
        .sort((a, b) => {
          const aTime = a.startTime || ''
          const bTime = b.startTime || ''
          return aTime.localeCompare(bTime)
        })
    )
    return res.data
  }, [])

  const remove = useCallback(async (id) => {
    await client.delete(`/routine/${id}`)
    setData((prev) => prev.filter((b) => b._id !== id && b.id !== id))
  }, [])

  const toggleComplete = useCallback(async (id, completed) => {
    const res = await client.put(`/routine/${id}`, { completed })
    setData((prev) => prev.map((b) => (b._id === id || b.id === id ? res.data : b)))
    return res.data
  }, [])

  return { data, loading, error, refetch: fetchRoutine, create, update, delete: remove, toggleComplete }
}
