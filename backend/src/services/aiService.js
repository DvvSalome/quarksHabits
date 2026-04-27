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

const CONTENT_TEMPLATES = {
  twitter: {
    label: 'Hilo de Twitter/X',
    instructions: 'Genera un hilo de Twitter/X de entre 4 y 8 tweets. Cada tweet máximo 280 caracteres. El primero debe enganchar (hook). Numera los tweets como (1/N), (2/N), etc. Incluye emojis con criterio.',
  },
  linkedin: {
    label: 'Post de LinkedIn',
    instructions: 'Genera un post de LinkedIn entre 150 y 300 palabras. Estructura: gancho inicial, desarrollo en párrafos cortos (2-3 líneas), conclusión accionable, y 3-5 hashtags al final. Tono profesional pero humano.',
  },
  newsletter: {
    label: 'Newsletter',
    instructions: 'Genera un email de newsletter entre 300 y 500 palabras. Estructura: asunto atractivo, saludo, hook, 2-3 puntos principales con subtítulos, llamado a la acción al final, despedida.',
  },
  email: {
    label: 'Email profesional',
    instructions: 'Genera un email profesional. Asunto claro y específico. Cuerpo conciso (máximo 200 palabras). Tono cordial pero directo. Estructura: saludo, contexto, mensaje principal, llamado a la acción, despedida.',
  },
  video: {
    label: 'Guión de video corto',
    instructions: 'Genera un guión para video corto (60-90 segundos, ~150-200 palabras). Estructura: hook (3 primeros segundos), desarrollo con 3 puntos, llamado a la acción final. Incluye indicaciones de [VISUAL] entre paréntesis.',
  },
  blog: {
    label: 'Borrador de blog post',
    instructions: 'Genera un borrador de blog post entre 600 y 900 palabras. Estructura: título atractivo, intro, 3-4 secciones con subtítulos H2, conclusión con call-to-action.',
  },
}

async function generateContent({
  apiKey, model, provider = 'openrouter',
  templateType, topic, audience, tone, extraContext,
}) {
  validate(apiKey, model);

  const template = CONTENT_TEMPLATES[templateType];
  if (!template) {
    const err = new Error('templateType inválido');
    err.status = 400;
    throw err;
  }
  if (!topic || topic.trim() === '') {
    const err = new Error('topic es requerido');
    err.status = 400;
    throw err;
  }

  const prompt = `Genera contenido siguiendo estas especificaciones:

FORMATO: ${template.label}
INSTRUCCIONES: ${template.instructions}

TEMA: ${topic}
${audience ? `AUDIENCIA: ${audience}` : ''}
${tone ? `TONO: ${tone}` : ''}
${extraContext ? `\nCONTEXTO ADICIONAL: ${extraContext}` : ''}

Genera el contenido directamente, sin preámbulos ni explicaciones. No uses markdown excepto cuando sea natural para el formato (ej. negritas en LinkedIn, headings en blog).`;

  const reply = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: 'Eres un copywriter experto. Generas contenido en español, atractivo y específico al formato solicitado. Nunca generas placeholders genéricos.' },
      { role: 'user', content: prompt },
    ],
    jsonMode: false,
  });

  if (!reply) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  return { content: reply.trim(), template: template.label };
}

async function repurposeContent({
  apiKey, model, provider = 'openrouter',
  sourceContent, targetTemplateType,
}) {
  validate(apiKey, model);

  const template = CONTENT_TEMPLATES[targetTemplateType];
  if (!template) {
    const err = new Error('targetTemplateType inválido');
    err.status = 400;
    throw err;
  }

  const prompt = `Adapta el siguiente contenido a otro formato.

CONTENIDO ORIGINAL:
${sourceContent}

FORMATO DESTINO: ${template.label}
INSTRUCCIONES: ${template.instructions}

Mantén las ideas centrales pero adapta longitud, estructura y tono al nuevo formato. Genera el contenido directamente sin explicaciones.`;

  const reply = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: 'Eres un copywriter experto en adaptar contenido entre formatos. Respondes solo con el contenido adaptado, sin explicaciones.' },
      { role: 'user', content: prompt },
    ],
    jsonMode: false,
  });

  if (!reply) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  return { content: reply.trim(), template: template.label };
}

async function getPlanSuggestions({
  apiKey, model, provider = 'openrouter',
  date, currentTasks = [], pendingTasks = [], tomorrowEvents = [], habits = [],
}) {
  validate(apiKey, model);

  const taskList = currentTasks.length > 0
    ? currentTasks.map((t) => `- ${t.activity}${t.startTime ? ` (${t.startTime})` : ' (sin hora)'}`).join('\n')
    : '(sin tareas todavía)';

  const pendingTaskList = pendingTasks.slice(0, 12)
    .map((t) => `- ${t.title}${t.priority ? ` [${t.priority}]` : ''}`)
    .join('\n') || '(sin tareas pendientes)';

  const eventList = tomorrowEvents.length > 0
    ? tomorrowEvents.map((e) => `- ${e.title}${e.startTime ? ` a las ${e.startTime}` : ''}`).join('\n')
    : '(sin eventos)';

  const habitList = habits.length > 0
    ? habits.map((h) => `- ${h.name} (racha: ${h.streak || 0} días)`).join('\n')
    : '(sin hábitos)';

  const prompt = `Estoy planificando mañana (${date}).

Tareas que ya agregué:
${taskList}

Tareas pendientes por hacer:
${pendingTaskList}

Eventos de mañana:
${eventList}

Hábitos que debo mantener:
${habitList}

Sugiere entre 3 y 6 tareas o actividades para completar mañana. Considera:
- Las tareas más prioritarias
- Espacios para eventos ya fijados
- Descansos y hábitos diarios
- No sobrecargar el día
- Si ya hay tareas en el plan, sugiere solo lo que falta

Puedes sugerir una hora OPCIONAL (mañana=08:00-12:00, tarde=13:00-17:00, noche=19:00-22:00) o sin hora si es flexible.

Responde SOLO con este JSON (sin markdown, sin código):
[{"activity":"descripción concreta","startTime":"HH:MM o null","reason":"por qué"}]`;

  const raw = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: 'Eres un coach de productividad experto. Responde siempre en español y solo con el JSON solicitado.' },
      { role: 'user', content: prompt },
    ],
    jsonMode: true,
  });

  if (!raw) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  let suggestions;
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    suggestions = JSON.parse(match ? match[0] : raw);
    if (!Array.isArray(suggestions)) throw new Error('Not an array');
  } catch {
    const err = new Error('El modelo no devolvió un formato válido');
    err.status = 502;
    throw err;
  }

  return { suggestions };
}

async function getWeeklyReview({
  apiKey, model, provider = 'openrouter',
  period, completedTasks = [], habitCount, habitLogsCompleted,
  expectedHabitLogs, eventCount, maxStreak,
}) {
  validate(apiKey, model);

  const habitRate = expectedHabitLogs > 0
    ? Math.round((habitLogsCompleted / expectedHabitLogs) * 100)
    : null;

  const taskList = completedTasks.length > 0
    ? completedTasks.map((t) => `- ${t.title}${t.priority ? ` [${t.priority}]` : ''}${t.category ? ` (${t.category})` : ''}`).join('\n')
    : '(ninguna tarea completada)';

  const prompt = `El usuario completó las siguientes tareas esta ${period}:
${taskList}

Estadísticas:
- Tareas completadas: ${completedTasks.length}
- Hábitos: ${habitCount} configurados, ${habitLogsCompleted} registros completados${habitRate !== null ? `, ${habitRate}% de cumplimiento` : ''}
- Eventos asistidos: ${eventCount}
- Racha activa máxima: ${maxStreak} días

Genera un resumen motivacional y personal de los logros de esta ${period}.
Habla en segunda persona ("lograste", "completaste").
Sé genuinamente positivo pero sin exagerar. Reconoce el esfuerzo real.
Menciona logros específicos de la lista de tareas si los hay.
Si el cumplimiento de hábitos es alto (>70%), felicita por eso específicamente.
Termina con una frase de aliento para el siguiente ${period === 'semana' ? 'período' : 'mes'}.
Máximo 150 palabras. Sin listas, solo texto fluido en párrafos cortos.`;

  const reply = await callProvider({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    messages: [
      { role: 'system', content: 'Eres un coach personal motivacional. Tus respuestas son cálidas, genuinas y específicas. Siempre en español.' },
      { role: 'user', content: prompt },
    ],
    jsonMode: false,
  });

  if (!reply) {
    const err = new Error('Respuesta vacía del modelo');
    err.status = 502;
    throw err;
  }

  return { review: reply.trim() };
}

module.exports = {
  getSuggestions,
  getChatReply,
  listModels,
  getWeeklyReview,
  getPlanSuggestions,
  generateContent,
  repurposeContent,
  CONTENT_TEMPLATES,
};
