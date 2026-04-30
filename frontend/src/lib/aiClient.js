const OPENROUTER_URL = 'https://openrouter.ai/api/v1'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta'

function parseJsonFromText(text) {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!match) throw new Error('La IA devolvio una respuesta no valida')
    return JSON.parse(match[0])
  }
}

async function callOpenRouter({ apiKey, model, messages }) {
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `OpenRouter error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini({ apiKey, model, messages }) {
  const contents = messages
    .filter((m) => m.role === 'system' || m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const res = await fetch(`${GEMINI_URL}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function aiText({ provider, apiKey, model, systemPrompt, userPrompt }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
  if (provider === 'gemini') return callGemini({ apiKey, model, messages })
  return callOpenRouter({ apiKey, model, messages })
}

export async function aiChat({ provider, apiKey, model, systemPrompt, messages }) {
  const all = [{ role: 'system', content: systemPrompt }, ...messages]
  if (provider === 'gemini') return callGemini({ apiKey, model, messages: all })
  return callOpenRouter({ apiKey, model, messages: all })
}

export async function aiJson({ provider, apiKey, model, systemPrompt, userPrompt }) {
  const content = await aiText({ provider, apiKey, model, systemPrompt, userPrompt })
  return parseJsonFromText(content)
}

export async function fetchModels({ provider, apiKey }) {
  if (provider === 'gemini') {
    const res = await fetch(`${GEMINI_URL}/models?key=${apiKey}`)
    if (!res.ok) throw new Error('No se pudieron obtener modelos de Gemini')
    const data = await res.json()
    return (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => ({ id: m.name.replace('models/', ''), label: m.displayName || m.name }))
  }

  const res = await fetch(`${OPENROUTER_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error('No se pudieron obtener modelos de OpenRouter')
  const data = await res.json()
  return (data.data || []).map((m) => ({ id: m.id, label: m.name || m.id }))
}
