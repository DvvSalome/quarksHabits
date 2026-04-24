import { useRoutine } from '../hooks/useRoutine'
import DayTimeline from '../components/routine/DayTimeline'
import toast from 'react-hot-toast'

export default function Routine() {
  const { data: blocks, loading, create, update, delete: del } = useRoutine()

  const handleCreate = async (data) => {
    try {
      await create(data)
      toast.success('Bloque creado')
    } catch {}
  }

  const handleUpdate = async (id, data) => {
    try {
      await update(id, data)
      toast.success('Bloque actualizado')
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await del(id)
      toast.success('Bloque eliminado')
    } catch {}
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rutina diaria</h1>
        <p className="text-sm text-gray-500 mt-0.5">Organiza tu día en bloques de tiempo</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DayTimeline
            blocks={blocks}
            timeSlot="morning"
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
          <DayTimeline
            blocks={blocks}
            timeSlot="afternoon"
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
          <DayTimeline
            blocks={blocks}
            timeSlot="evening"
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  )
}
