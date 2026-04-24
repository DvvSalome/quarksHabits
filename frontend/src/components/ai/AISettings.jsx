import { useState, useEffect } from 'react'
import { Key, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter',
    url: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-...',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (gratis)' },
      { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (gratis)' },
      { id: 'google/gemma-3-12b-it:free', label: 'Gemma 3 12B (gratis)' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'openai/gpt-4o', label: 'GPT-4o' },
      { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    url: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (gratis)' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (gratis)' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (gratis)' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { id: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro' },
    ],
  },
}

export default function AISettings() {
  const [provider, setProvider] = useState('openrouter')
  const [keys, setKeys] = useState({ openrouter: '', gemini: '' })
  const [models, setModels] = useState({ openrouter: '', gemini: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedProvider = localStorage.getItem('ai_provider') || 'openrouter'
    const storedOrKey = localStorage.getItem('ai_api_key') || ''
    const storedOrModel = localStorage.getItem('ai_model') || ''
    const storedGeminiKey = localStorage.getItem('ai_gemini_key') || ''
    const storedGeminiModel = localStorage.getItem('ai_gemini_model') || ''

    setProvider(storedProvider)
    setKeys({ openrouter: storedOrKey, gemini: storedGeminiKey })
    setModels({ openrouter: storedOrModel, gemini: storedGeminiModel })

    const activeKey = storedProvider === 'gemini' ? storedGeminiKey : storedOrKey
    const activeModel = storedProvider === 'gemini' ? storedGeminiModel : storedOrModel
    if (activeKey && activeModel) setSaved(true)
  }, [])

  const handleSave = () => {
    const key = keys[provider]
    const model = models[provider]
    if (!key.trim()) {
      toast.error(`Ingresa una API Key de ${PROVIDERS[provider].label}`)
      return
    }
    if (!model.trim()) {
      toast.error('Selecciona o escribe un modelo')
      return
    }

    localStorage.setItem('ai_provider', provider)
    if (provider === 'gemini') {
      localStorage.setItem('ai_gemini_key', key.trim())
      localStorage.setItem('ai_gemini_model', model.trim())
    } else {
      localStorage.setItem('ai_api_key', key.trim())
      localStorage.setItem('ai_model', model.trim())
    }
    setSaved(true)
    toast.success('Configuración guardada')
  }

  const handleClear = () => {
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ai_api_key')
    localStorage.removeItem('ai_model')
    localStorage.removeItem('ai_gemini_key')
    localStorage.removeItem('ai_gemini_model')
    setKeys({ openrouter: '', gemini: '' })
    setModels({ openrouter: '', gemini: '' })
    setSaved(false)
    toast.success('Configuración eliminada')
  }

  const activeKey = keys[provider]
  const activeModel = models[provider]
  const isConfigured = saved && !!activeKey && !!activeModel
  const cfg = PROVIDERS[provider]

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Key className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Asistente de IA</h3>
          <p className="text-sm text-gray-500">Elige tu proveedor y modelo</p>
        </div>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
        {Object.entries(PROVIDERS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => { setProvider(key); setSaved(false) }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              provider === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-sm ${
        isConfigured ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
      }`}>
        {isConfigured ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Configurado — <span className="font-mono font-medium">{activeModel}</span></span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            Sin configurar — el asistente no está disponible
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Input
            label={`${cfg.label} API Key`}
            type="password"
            value={activeKey}
            onChange={(e) => { setKeys((k) => ({ ...k, [provider]: e.target.value })); setSaved(false) }}
            placeholder={cfg.placeholder}
          />
          <a
            href={cfg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline mt-1"
          >
            Obtener API Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <Input
            label="Modelo"
            type="text"
            value={activeModel}
            onChange={(e) => { setModels((m) => ({ ...m, [provider]: e.target.value })); setSaved(false) }}
            placeholder={cfg.models[0]?.id}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {cfg.models.map((m) => (
              <button
                key={m.id}
                onClick={() => { setModels((prev) => ({ ...prev, [provider]: m.id })); setSaved(false) }}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  activeModel === m.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Tus claves se guardan solo en este navegador y solo se envían al proveedor elegido.
        </p>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Guardar configuración
          </Button>
          {(activeKey || activeModel) && (
            <Button variant="danger" onClick={handleClear}>
              Limpiar todo
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
