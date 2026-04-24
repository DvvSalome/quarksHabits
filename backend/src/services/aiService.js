const fetch = require('node-fetch');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT =
  'Eres un asistente personal inteligente. Analiza las tareas, hábitos y eventos del usuario y proporciona sugerencias concretas y accionables para organizar su día. Responde SIEMPRE en español y SOLO con el JSON solicitado, sin texto adicional.';

async function getSuggestions({ apiKey, model, provider = 'openrouter', tasks = [], habits = [], events = [], date }) {
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

  const today = date || new Date().toISOString().slice(0, 10);
  const userContent = buildUserPrompt({ tasks, habits, events, date: today });

  let raw;

  if (provider === 'gemini') {
    raw = await callGemini({ apiKey: apiKey.trim(), model: model.trim(), userContent });
  } else {
    raw = await callOpenRouter({ apiKey: apiKey.trim(), model: model.trim(), userContent });
  }

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
    parsed = {
      dailySuggestion: raw,
      priorityRecommendations: [],
      timeBlocks: [],
      motivationalMessage: '',
    };
  }

  return {
    dailySuggestion: parsed.dailySuggestion || parsed.daily_suggestion || '',
    priorityRecommendations: parsed.priorityRecommendations || parsed.priority_recommendations || [],
    timeBlocks: parsed.timeBlocks || parsed.time_blocks || [],
    motivationalMessage: parsed.motivationalMessage || parsed.motivational_message || '',
  };
}

async function callOpenRouter({ apiKey, model, userContent }) {
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
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
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

async function callGemini({ apiKey, model, userContent }) {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || `Gemini status ${response.status}`;
    const err = new Error(message);
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function buildUserPrompt({ tasks, habits, events, date }) {
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

module.exports = { getSuggestions };
