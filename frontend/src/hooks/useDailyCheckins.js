import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const EMPTY_DAILY_CHECKIN = {
  mood: 3,
  energy: 3,
  sleepHours: '',
  phoneLevel: 3,
  meals: 0,
  studyMinutes: '',
  impostorLevel: 3,
  win: '',
  evidence: '',
  tomorrow: '',
  note: '',
}

function parseCheckin(row) {
  try {
    return {
      id: row.id,
      date: row.topic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...EMPTY_DAILY_CHECKIN,
      ...JSON.parse(row.body || '{}'),
    }
  } catch {
    return {
      id: row.id,
      date: row.topic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...EMPTY_DAILY_CHECKIN,
      note: row.body || '',
    }
  }
}

export function useDailyCheckins() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCheckins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!user?.id) {
        setData([])
        return
      }
      const { data: rows, error: queryError } = await supabase
        .from('Content')
        .select('*')
        .eq('templateType', 'daily-checkin')
        .order('topic', { ascending: false })
      if (queryError) throw queryError
      setData((rows || []).map(parseCheckin))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCheckins()
  }, [fetchCheckins])

  const save = useCallback(async (date, values) => {
    if (!user?.id) throw new Error('Usuario no autenticado')
    const payload = {
      ...EMPTY_DAILY_CHECKIN,
      ...values,
      mood: Number(values.mood || 0),
      energy: Number(values.energy || 0),
      phoneLevel: Number(values.phoneLevel || 0),
      meals: Number(values.meals || 0),
      impostorLevel: Number(values.impostorLevel || 0),
      sleepHours: values.sleepHours === '' ? '' : Number(values.sleepHours),
      studyMinutes: values.studyMinutes === '' ? '' : Number(values.studyMinutes),
    }

    const { data: saved, error: saveError } = await supabase
      .from('Content')
      .upsert({
        id: `daily-checkin:${user.id}:${date}`,
        userId: user.id,
        templateType: 'daily-checkin',
        topic: date,
        body: JSON.stringify(payload),
      })
      .select()
      .single()
    if (saveError) throw saveError

    const parsed = parseCheckin(saved)
    setData((prev) => {
      const without = prev.filter((item) => item.date !== date)
      return [parsed, ...without].sort((a, b) => b.date.localeCompare(a.date))
    })
    return parsed
  }, [user?.id])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const today = useMemo(
    () => data.find((item) => item.date === todayStr) || null,
    [data, todayStr]
  )

  return { data, today, loading, error, refetch: fetchCheckins, save }
}
