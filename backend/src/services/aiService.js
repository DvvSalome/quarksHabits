const fetch = require('node-fetch');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const ANALYZE_SYSTEM =
  'Eres un asistente personal inteligente. Analiza las tareas, hábitos y eventos del usuario y proporciona sugerencias concretas y accionables para organizar su día. Responde SIEMPRE en español y SOLO con el JSON solicitado, sin texto adicional.';

const CHAT_SYSTEM = `Eres un asistente personal inteligente, amigable y conciso. Ayudas al usuario con productividad, organización y bienestar.

Tienes acceso al contexto actual del usuario: sus tareas, hábitos, eventos y rutina. Úsalo para dar respuestas personalizadas. Si el usuario pide algo que no puedes hacer directamente (como crear una tarea), explícale qué haría y en qué sección de la app puede hacerlo.

Responde SIEMPRE en español. Sé breve y directo (2-4 oraciones cuando sea posible). Usa listas solo cuando sean útiles. Nunca uses markdown de tipo "código" salvo para rutas o valores técnicos.`;

function validate(apiKey, model) {
  if (!apiKey || apiKey.trim() === '') {
    const err = new Error('apiKey es requerido');
    err.status = 400;
    throw err;
  }
  if (!model || model.trim() === '') {
    const err = new Error('model es requerido');
    err.status = 400;
    throw err;
  }
}

async function callProvider({ provider, apiKey, model, messages, jsonMode = false }) {
  if (provider === 'gemini') {
    return callGemini({ apiKey, model, messages, jsonMode });
  }
  return callOpenRouter({ apiKey, model, messages, jsonMode });
}

async function callOpenRouter({ apiKey, model, messages, jsonMode }) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Asistente Personal',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const meta = body?.error?.metadata;
    const message =
      meta?.raw ||
      (meta?.provider_name ? `${meta.provider_name}: ${body?.error?.message}` : null) ||
      body?.error?.message ||
      `OpenRouter status ${response.status}`;
    const err = new Error(message);
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

async function callGemini({ apiKey, model, messages, jsonMode }) {
  const modelId = model.startsWith('models/') ? model.slice(7) : model;
  const url = `${GEMINI_BASE_URL}/${modelId}:generateContent`;

  const systemMsgs = messages.filter((m) => m.role === 'system');
  const convoMsgs = messages.filter((m) => m.role !== 'system');

  const contents = convoMsgs.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemMsgs.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemMsgs.map((m) => m.content).join('\n\n') }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const rootError = Array.isArray(errBody) ? errBody[0]?.error : errBody?.error;
    const detail = rootError?.details?.find((d) => d.reason)?.reason || rootError?.status || '';
    const message =
      [rootError?.message, detail].filter(Boolean).join(' — ') ||
      `Gemini status ${response.status}`;
    console.error('[Gemini error]', JSON.stringify(errBody, null, 2));
    const err = new Error(message);
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function getSuggestions({ apiKey, model, provider = 'openrouter', tasks = [], habits = [], events = [], date }) {
  validate(apiKey, model);
  const today = date || new Date().toISOString().slice(0, 10);
  const userContent = buildAnalyzePrompt({ tasks, habits, events, date: today });

  const raw = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: ANALYZE_SYSTEM },
      { role: 'user', content: userContent },
    ],
    jsonMode: true,
  });

  if (!raw) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    parsed = { dailySuggestion: raw, priorityRecommendations: [], timeBlocks: [], motivationalMessage: '' };
  }

  return {
    dailySuggestion: parsed.dailySuggestion || parsed.daily_suggestion || '',
    priorityRecommendations: parsed.priorityRecommendations || parsed.priority_recommendations || [],
    timeBlocks: parsed.timeBlocks || parsed.time_blocks || [],
    motivationalMessage: parsed.motivationalMessage || parsed.motivational_message || '',
  };
}

async function getChatReply({ apiKey, model, provider = 'openrouter', messages = [], context = {} }) {
  validate(apiKey, model);

  if (!Array.isArray(messages) || messages.length === 0) {
    const err = new Error('messages es requerido (array no vacío)');
    err.status = 400;
    throw err;
  }

  const contextBlock = buildContextBlock(context);
  const systemContent = `${CHAT_SYSTEM}\n\n${contextBlock}`;

  const reply = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: String(m.content || '') })),
    ],
    jsonMode: false,
  });

  if (!reply) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  return { reply: reply.trim() };
}

function buildContextBlock({ tasks = [], habits = [], events = [], routine = [] }) {
  const pending = tasks.filter((t) => !t.completed);
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => {
    if (!e.startTime) return false;
    return String(e.startTime).slice(0, 10) === today;
  });

  const lines = [
    '## Contexto actual del usuario',
    `Fecha: ${today}`,
    '',
    `Tareas pendientes (${pending.length}):`,
    ...pending.slice(0, 15).map(
      (t) => `- ${t.title}${t.priority ? ` [${t.priority}]` : ''}${t.dueDate ? ` (vence ${new Date(t.dueDate).toLocaleDateString('es-ES')})` : ''}`
    ),
    '',
    `Hábitos (${habits.length}):`,
    ...habits.slice(0, 10).map((h) => `- ${h.name} — racha ${h.streak || 0} días`),
    '',
    `Eventos de hoy (${todayEvents.length}):`,
    ...todayEvents.map((e) => `- ${e.title}${e.startTime ? ` a las ${new Date(e.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}`),
    '',
    `Rutina (${routine.length} bloques):`,
    ...routine.slice(0, 10).map((b) => `- ${b.startTime}-${b.endTime} [${b.timeSlot}] ${b.activity || b.title}`),
  ];

  return lines.join('\n');
}

function buildAnalyzePrompt({ tasks, habits, events, date }) {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const lines = [
    `Fecha de hoy: ${date}`,
    '',
    `## Tareas pendientes (${pendingTasks.length})`,
    ...pendingTasks.map(
      (t) =>
        `- [${t.priority?.toUpperCase() || 'MEDIUM'}] ${t.title}${t.dueDate ? ` (vence: ${new Date(t.dueDate).toLocaleDateString('es-ES')})` : ''}${t.category ? ` [${t.category}]` : ''}`
    ),
    '',
    `## Tareas completadas hoy (${completedTasks.length})`,
    ...completedTasks.map((t) => `- ✓ ${t.title}`),
    '',
    `## Hábitos (${habits.length})`,
    ...habits.map((h) => `- ${h.name} (${h.frequency}) — racha actual: ${h.streak || 0} días`),
    '',
    `## Eventos de hoy (${events.length})`,
    ...events.map(
      (e) =>
        `- ${e.title}${e.startTime ? ` a las ${new Date(e.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}${e.allDay ? ' (todo el día)' : ''}`
    ),
    '',
    'Responde SOLO con este JSON (sin markdown, sin código, sin explicaciones):',
    '{',
    '  "dailySuggestion": "Resumen ejecutivo del día con las acciones más importantes",',
    '  "priorityRecommendations": ["acción recomendada 1", "acción recomendada 2"],',
    '  "timeBlocks": [{"time": "09:00 - 10:00", "activity": "descripción"}],',
    '  "motivationalMessage": "Mensaje motivacional corto y personalizado"',
    '}',
  ];

  return lines.join('\n');
}

async function listModels({ apiKey, provider = 'openrouter' }) {
  if (!apiKey || apiKey.trim() === '') {
    const err = new Error('apiKey es requerido');
    err.status = 400;
    throw err;
  }

  if (provider === 'gemini') {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey.trim() },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const rootError = Array.isArray(body) ? body[0]?.error : body?.error;
      const err = new Error(rootError?.message || `Gemini status ${response.status}`);
      err.status = response.status === 401 ? 401 : 502;
      throw err;
    }
    const json = await response.json();
    const models = (json.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => ({
        id: m.name.replace(/^models\//, ''),
        label: m.displayName || m.name,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return { models };
  }

  // OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body?.error?.message || `OpenRouter status ${response.status}`);
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }
  const json = await response.json();
  const models = (json.data || [])
    .map((m) => ({ id: m.id, label: m.name || m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return { models };
}

module.exports = { getSuggestions, getChatReply, listModels };
