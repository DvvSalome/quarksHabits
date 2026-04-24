import { useState, useEffect } from 'react'
import { Key, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

const MODEL_SUGGESTIONS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.1-8b-instruct',
]

export default function AISettings() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedKey = localStorage.getItem('ai_api_key')
    const storedModel = localStorage.getItem('ai_model')
    if (storedKey) setApiKey(storedKey)
    if (storedModel) setModel(storedModel)
    if (storedKey && storedModel) setSaved(true)
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Ingresa una API Key de OpenRouter')
      return
    }
    if (!model.trim()) {
      toast.error('Especifica el modelo a usar')
      return
    }
    localStorage.setItem('ai_api_key', apiKey.trim())
    localStorage.setItem('ai_model', model.trim())
    setSaved(true)
    toast.success('Configuración guardada')
  }

  const handleClear = () => {
    localStorage.removeItem('ai_api_key')
    localStorage.removeItem('ai_model')
    setApiKey('')
    setModel('')
    setSaved(false)
    toast.success('Configuración eliminada')
  }

  const isConfigured = saved && !!apiKey && !!model

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Key className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Asistente de IA</h3>
          <p className="text-sm text-gray-500">
            Conecta con{' '}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
            >
              OpenRouter <ExternalLink className="w-3 h-3" />
            </a>
            {' '}para análisis inteligente
          </p>
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-5 text-sm ${
        isConfigured ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
      }`}>
        {isConfigured ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Configurado — usando <span className="font-mono font-medium">{model}</span></span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            Sin configurar — el asistente no está disponible
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="OpenRouter API Key"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
          placeholder="sk-or-..."
        />

        <div>
          <Input
            label="Modelo"
            type="text"
            value={model}
            onChange={(e) => { setModel(e.target.value); setSaved(false) }}
            placeholder="openai/gpt-4o-mini"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {MODEL_SUGGESTIONS.map((m) => (
              <button
                key={m}
                onClick={() => { setModel(m); setSaved(false) }}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors font-mono ${
                  model === m
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Tu API Key y modelo se guardan únicamente en este navegador (localStorage) y nunca pasan por ningún servidor externo salvo OpenRouter.
        </p>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Guardar configuración
          </Button>
          {(apiKey || model) && (
            <Button variant="danger" onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
