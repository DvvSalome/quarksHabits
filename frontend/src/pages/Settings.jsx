import { Bell, Globe, Moon, User } from 'lucide-react'
import AISettings from '../components/ai/AISettings'
import Card from '../components/ui/Card'
import { useTasks } from '../hooks/useTasks'
import { useHabits } from '../hooks/useHabits'
import { useEvents } from '../hooks/useEvents'

export default function Settings() {
  const tasks = useTasks()
  const habits = useHabits()
  const events = useEvents()

  const downloadWeeklyReport = async () => {
    const now = new Date()
    const content = `<!doctype html><html><head><meta charset="utf-8"/><title>Reporte semanal</title></head><body><h1>Reporte semanal</h1><p>Generado: ${now.toISOString()}</p><ul><li>Tareas: ${tasks.data.length}</li><li>Habitos: ${habits.data.length}</li><li>Eventos: ${events.data.length}</li></ul></body></html>`
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-semanal-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Personaliza tu experiencia</p>
      </div>

      {/* AI Settings */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Asistente de IA
        </h2>
        <AISettings />
      </section>

      {/* Preferences */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Preferencias
        </h2>
        <Card>
          <div className="flex flex-col gap-5">
            {/* Placeholder preference items */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nombre</p>
                  <p className="text-xs text-gray-400">Personaliza cómo te saluda el asistente</p>
                </div>
              </div>
              <span className="text-xs text-gray-300 italic">Próximamente</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Moon className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tema oscuro</p>
                  <p className="text-xs text-gray-400">Cambia entre modo claro y oscuro</p>
                </div>
              </div>
              <span className="text-xs text-gray-300 italic">Próximamente</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Notificaciones</p>
                  <p className="text-xs text-gray-400">Recibe recordatorios de tareas y hábitos</p>
                </div>
              </div>
              <span className="text-xs text-gray-300 italic">Próximamente</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Idioma</p>
                  <p className="text-xs text-gray-400">Español (por defecto)</p>
                </div>
              </div>
              <span className="text-xs text-gray-300 italic">Próximamente</span>
            </div>
          </div>
        </Card>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Reportes
        </h2>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Reporte semanal en HTML</p>
              <p className="text-xs text-gray-400">Descarga tus avances de la semana actual.</p>
            </div>
            <button
              type="button"
              onClick={downloadWeeklyReport}
              className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
            >
              Descargar
            </button>
          </div>
        </Card>
      </section>

      {/* Info */}
      <div className="text-center pt-4">
        <p className="text-xs text-gray-300">Asistente Personal v0.1.0</p>
      </div>
    </div>
  )
}
