const fetch = require('node-fetch');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT =
  'Eres un asistente personal inteligente. Analiza las tareas, hábitos y eventos del usuario y proporciona sugerencias concretas y accionables para organizar su día.';

async function getSuggestions({ apiKey, tasks = [], habits = [], events = [], date }) {
  if (!apiKey || apiKey.trim() === '') {
    const err = new Error('apiKey is required in request body');
    err.status = 400;
    throw err;
  }

  const today = date || new Date().toISOString().slice(0, 10);

  const userContent = buildUserPrompt({ tasks, habits, events, date: today });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || `OpenAI API returned status ${response.status}`;
    const err = new Error(message);
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;

  if (!raw) {
    const err = new Error('Empty response from OpenAI');
    err.status = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Wrap non-JSON response in our structure
    parsed = {
      dailySuggestion: raw,
      priorityRecommendations: [],
      timeBlocks: [],
      motivationalMessage: '',
    };
  }

  // Ensure shape
  return {
    dailySuggestion: parsed.dailySuggestion || parsed.daily_suggestion || '',
    priorityRecommendations:
      parsed.priorityRecommendations || parsed.priority_recommendations || [],
    timeBlocks: parsed.timeBlocks || parsed.time_blocks || [],
    motivationalMessage: parsed.motivationalMessage || parsed.motivational_message || '',
  };
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
    ...habits.map(
      (h) =>
        `- ${h.name} (${h.frequency}) — racha actual: ${h.streak || 0} días`
    ),
    '',
    `## Eventos de hoy (${events.length})`,
    ...events.map(
      (e) =>
        `- ${e.title}${e.startTime ? ` a las ${new Date(e.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}${e.allDay ? ' (todo el día)' : ''}`
    ),
    '',
    'Por favor, responde SOLO con un objeto JSON con esta estructura exacta:',
    '{',
    '  "dailySuggestion": "Resumen ejecutivo del día con las acciones más importantes",',
    '  "priorityRecommendations": ["tarea o acción recomendada 1", "tarea o acción recomendada 2", "..."],',
    '  "timeBlocks": [{"time": "09:00 - 10:00", "activity": "descripción de la actividad"}, ...],',
    '  "motivationalMessage": "Mensaje motivacional corto y personalizado"',
    '}',
  ];

  return lines.join('\n');
}

module.exports = { getSuggestions };
