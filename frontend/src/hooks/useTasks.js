import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function useTasks() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await client.get('/tasks')
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const create = useCallback(async (taskData) => {
    const res = await client.post('/tasks', taskData)
    setData((prev) => [...prev, res.data])
    return res.data
  }, [])

  const update = useCallback(async (id, taskData) => {
    const res = await client.put(`/tasks/${id}`, taskData)
    setData((prev) => prev.map((t) => (t._id === id || t.id === id ? res.data : t)))
    return res.data
  }, [])

  const remove = useCallback(async (id) => {
    await client.delete(`/tasks/${id}`)
    setData((prev) => prev.filter((t) => t._id !== id && t.id !== id))
  }, [])

  const toggle = useCallback(async (id, completed) => {
    const res = await client.put(`/tasks/${id}`, { completed })
    setData((prev) => prev.map((t) => (t._id === id || t.id === id ? res.data : t)))
    return res.data
  }, [])

  return { data, loading, error, refetch: fetchTasks, create, update, delete: remove, toggle }
}
