import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function useEvents() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await client.get('/events')
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const create = useCallback(async (eventData) => {
    const res = await client.post('/events', eventData)
    setData((prev) => [...prev, res.data])
    return res.data
  }, [])

  const update = useCallback(async (id, eventData) => {
    const res = await client.put(`/events/${id}`, eventData)
    setData((prev) => prev.map((e) => (e._id === id || e.id === id ? res.data : e)))
    return res.data
  }, [])

  const remove = useCallback(async (id) => {
    await client.delete(`/events/${id}`)
    setData((prev) => prev.filter((e) => e._id !== id && e.id !== id))
  }, [])

  return { data, loading, error, refetch: fetchEvents, create, update, delete: remove }
}
