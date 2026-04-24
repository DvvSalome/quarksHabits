import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function useRoutine() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoutine = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await client.get('/routine')
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoutine()
  }, [fetchRoutine])

  const create = useCallback(async (blockData) => {
    const res = await client.post('/routine', blockData)
    setData((prev) => [...prev, res.data])
    return res.data
  }, [])

  const update = useCallback(async (id, blockData) => {
    const res = await client.put(`/routine/${id}`, blockData)
    setData((prev) => prev.map((b) => (b._id === id || b.id === id ? res.data : b)))
    return res.data
  }, [])

  const remove = useCallback(async (id) => {
    await client.delete(`/routine/${id}`)
    setData((prev) => prev.filter((b) => b._id !== id && b.id !== id))
  }, [])

  return { data, loading, error, refetch: fetchRoutine, create, update, delete: remove }
}
