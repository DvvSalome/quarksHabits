import { useState, useEffect } from 'react'
import { Key, CheckCircle, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

export default function AISettings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('ai_api_key')
    if (stored) {
      setApiKey(stored)
      setSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Ingresa una API Key válida')
      return
    }
    localStorage.setItem('ai_api_key', apiKey.trim())
    setSaved(true)
    toast.success('API Key guardada')
  }

  const handleClear = () => {
    localStorage.removeItem('ai_api_key')
    setApiKey('')
    setSaved(false)
    toast.success('API Key eliminada')
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Key className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Asistente de IA</h3>
          <p className="text-sm text-gray-500">Conecta con OpenAI para análisis inteligente</p>
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-5 text-sm ${
        saved ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
      }`}>
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            API Key guardada y lista para usar
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-gray-400" />
            Sin configurar — el asistente no está disponible
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="OpenAI API Key"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
          placeholder="sk-..."
        />
        <p className="text-xs text-gray-400">
          Tu clave se guarda únicamente en este navegador (localStorage) y nunca se envía a ningún servidor externo salvo a la API de OpenAI.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Guardar API Key
          </Button>
          {saved && (
            <Button variant="danger" onClick={handleClear}>
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
