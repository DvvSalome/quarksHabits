# Mejoras propuestas — Asistente Personal

Análisis del 2026-04-25.

Este documento propone mejoras agrupadas por área. Cada propuesta incluye **valor de uso diario**, **complejidad de implementación** y **dependencias**.

---

## 🔥 PRIORIDAD ALTA — Pulir lo que ya existe

### M1. Drag & drop en el planificador nocturno
**Problema:** Hoy editar la hora de una tarea requiere abrir un modal y cambiar el campo `startTime`.

**Mejora:** Permitir arrastrar tareas entre las secciones (Mañana → Tarde → Noche → Sin hora). Al soltar en una sección, se le asigna una hora por defecto del rango (ej. mover a "Tarde" → asigna `13:00`).

**Valor:** Reordenar el plan se vuelve instantáneo, sin abrir formularios.

**Complejidad:** Media. Usar `react-dnd` o `@dnd-kit/core` (ligero, accesible).

---

### M2. Marcar tareas del plan como completadas durante el día
**Problema:** El plan de mañana se ve, pero no hay forma de marcar "hecho" cuando llega ese día.

**Mejora:** Agregar checkbox a cada tarea del plan. Al completar:
- Marca la tarea con un check
- Tachado visual
- Se cuenta en stats del día

**Valor:** Cierra el ciclo planificación → ejecución → progreso. Crítico para el sentido de logro.

**Complejidad:** Baja. Agregar campo `completed` a `RoutineBlock` y endpoint `PATCH /routine/:id/complete`.

---

### M3. "Reflexión rápida" al final del día
**Problema:** El usuario no captura lecciones del día. La revisión semanal con IA es buena pero distante.

**Mejora:** Modal automático al planear el día siguiente que pregunta:
- ¿Qué tarea de hoy salió mejor de lo esperado?
- ¿Qué pospusiste? ¿Por qué?
- Una palabra para describir el día

Estos datos alimentan a la IA para que el plan de mañana sea más realista (ej. si pospones siempre lo mismo a las 8am, la IA lo mueve a otra hora).

**Valor:** Combate el síndrome del impostor con captura de momentos positivos. Mejora gradualmente la calidad de las sugerencias de IA.

**Complejidad:** Media. Nueva tabla `DailyReflection` + integración con prompt de IA.

---

### M4. Notificaciones (PWA) para hábitos y bloques de tiempo
**Problema:** La app vive en el navegador. Si cierras la pestaña, no hay recordatorio.

**Mejora:** Convertir en PWA instalable + Notification API:
- Notificación a la hora programada de cada bloque del plan
- Notificación nocturna recordando planear mañana (ej. 21:00)
- Notificación matutina con el plan del día

**Valor:** La app pasa de "tablero pasivo" a "compañero activo". Sin esto, el usuario olvida que existe.

**Complejidad:** Media-alta. Service Worker + permisos de notificación + scheduling (con `setInterval` o cron via backend si abrimos sesiones autenticadas).

**Dependencia:** Requiere autenticación si queremos notificaciones desde el servidor.

---

### M5. Atajos de teclado globales
**Problema:** Todo se hace con clicks. La app es lenta de operar.

**Mejora:** Atajos:
- `n` → nueva tarea
- `g d` → ir a Dashboard
- `g r` → ir a Rutina
- `Cmd+K` → command palette (saltar a cualquier sección, agregar tarea, etc.)
- `Esc` → cerrar modales

**Valor:** Productividad real para usuarios power. Pequeño detalle que hace que se sienta profesional.

**Complejidad:** Baja-media. Librería `cmdk` o implementación manual con `useEffect` + `keydown`.

---

## 🌟 NUEVAS FUNCIONALIDADES — Para uso diario

### M6. Captura de notas / Inbox rápido
**Concepto:** Una caja de "Inbox" donde puedes tirar pensamientos sin clasificar. Después la IA los puede organizar:
- Detectar si es una tarea, una idea, una nota
- Sugerir categoría/prioridad si es tarea
- Convertir nota → tarea con un click

**Vista:**
```
┌─────────────────────────────────────────┐
│  Inbox                            [+]    │
├─────────────────────────────────────────┤
│  📝  Llamar al dentista                  │
│       └─ ¿Convertir en tarea? [Sí/No]    │
│                                          │
│  💡  Idea: post sobre productividad      │
│       └─ Etiqueta: contenido             │
└─────────────────────────────────────────┘
```

**Valor:** El cerebro suelta lo que tiene encima sin decidir dónde guardarlo. La IA lo organiza luego.

**Complejidad:** Media. Nueva tabla `Note`, vista nueva, integración con IA para categorizar.

---

### M7. Pomodoro / Timer integrado
**Concepto:** Botón "Empezar trabajo" en cada tarea o bloque del plan. Activa un timer de 25 min con notificación al final.

**Características:**
- Visual minimalista en una esquina
- Cuenta cuántos pomodoros completaste hoy
- Asocia el tiempo trabajado con la tarea
- Estadística semanal: "Esta semana enfocaste 5h 30min"

**Valor:** Transforma tareas en sesiones de trabajo concretas. Combate la procrastinación.

**Complejidad:** Baja. Componente local con `useEffect` + `setInterval`. Persistencia opcional en localStorage.

---

### M8. Generador de contenido (lo que mencionaste antes)
**Concepto:** Sección dedicada para crear borradores de contenido con IA.

**Templates:**
- 🐦 Hilo de Twitter/X
- 💼 Post de LinkedIn  
- 📝 Newsletter
- 🎬 Guión de video corto
- 📧 Correo

**Flujo:**
1. Eliges template
2. Defines: tema, público, tono
3. IA genera borrador
4. Editas
5. Guardas o copias al clipboard

**Bonus:** "Repropósito" — toma un contenido existente y lo adapta a otro formato (un blog post → hilo de X).

**Valor:** Si quieres construir presencia, automatiza el 80% del trabajo grueso.

**Complejidad:** Media. Nueva sección, prompt engineering, base de datos de templates.

---

### M9. Modo focus / "do not disturb"
**Concepto:** Botón "Modo focus" que:
- Esconde todo excepto la tarea actual o el bloque actual
- Pone la pantalla en blanco con un timer
- Bloquea notificaciones de la app
- Sale automáticamente al terminar el bloque

**Valor:** Para trabajo profundo. Reduce la distracción de ver la app entera.

**Complejidad:** Baja. Estado global + overlay full-screen.

---

### M10. Vista de calendario del mes con todo
**Problema:** El calendario actual solo muestra eventos. No se ve cuándo vencen tareas, cuándo cumpliste hábitos, etc.

**Mejora:** Una vista unificada del mes:
- Días con tareas vencidas → punto rojo
- Días con eventos → punto azul
- Días con hábitos cumplidos → punto verde
- Click en un día → modal con todo el detalle

**Valor:** Vista panorámica de la vida. Detectar patrones (ej. "siempre los miércoles tengo overload").

**Complejidad:** Media. Lógica de agregación + UI de calendario.

---

## 🚀 INTEGRACIONES — Conectar con el mundo real

### M11. Importar tareas desde email (Gmail)
**Concepto:** Reenvías un correo a `tareas@tu-app.com` (o conectas con Gmail OAuth) y se crea una tarea automáticamente. La IA extrae:
- Título sugerido
- Deadline si está mencionado
- Prioridad

**Valor:** Punto de entrada masivo. Mucha gente vive en el email — esto reduce la fricción a cero.

**Complejidad:** Alta. Requiere OAuth, parser de email, tabla de mapeo email→usuario.

---

### M12. Sync con Google Calendar
**Concepto:** Bidireccional. Eventos creados en la app aparecen en Google Calendar y viceversa.

**Valor:** Quien usa Google Meet/Calendar para reuniones no quiere mantener dos calendarios.

**Complejidad:** Alta. OAuth + Google Calendar API + lógica de sync (qué hacer con conflictos).

---

### M13. Slack / Discord integration para nudges
**Concepto:** Bot que te manda mensaje en Slack/Discord cuando:
- Es hora de un bloque del plan
- Llevas X días sin hacer un hábito
- Hay algo importante mañana

**Valor:** Si ya tienes Slack abierto, no necesitas abrir otra app.

**Complejidad:** Media. Webhook + bot framework.

---

## 🛠️ MEJORAS TÉCNICAS / DX

### M14. Autenticación + multi-usuario
**Estado actual:** Sin login. Todos los datos están en la SQLite local.

**Mejora:** Email/password con JWT + multi-tenancy.

**Valor:** Permite usar la app desde varios dispositivos, sincronización cloud, base para colaboración futura.

**Complejidad:** Alta. Cambia toda la arquitectura de datos.

---

### M15. Migrar a Supabase (cloud)
**Estado actual:** SQLite local en el backend Express.

**Mejora:** Base de datos PostgreSQL en Supabase + auth incluido.

**Valor:** Persistencia entre dispositivos. Backups automáticos. Real-time subscriptions.

**Complejidad:** Alta. Migración de Prisma → Supabase client.

---

### M16. Tests automatizados
**Estado actual:** Sin tests.

**Mejora:** 
- Unitarios: Vitest para hooks y utils
- Integración: Playwright para flujos críticos (crear tarea, completar hábito, etc.)

**Valor:** Confianza al refactorizar. Detección temprana de bugs como los recién encontrados.

**Complejidad:** Media. Setup inicial + escribir tests.

---

### M17. Modo oscuro
**Mejora:** Toggle entre light/dark con persistencia en localStorage.

**Valor:** Para uso nocturno. Es ya un estándar.

**Complejidad:** Baja-media. Variables CSS o `dark:` de Tailwind.

---

### M18. Logging estructurado y monitoring
**Estado actual:** `console.error` aquí y allá.

**Mejora:** 
- Backend: Winston o Pino para logs estructurados
- Frontend: Sentry para errores en producción
- Métricas: tiempo de respuesta de la IA, tasa de errores

**Valor:** Cuando algo se rompe en producción, debugging es mucho más rápido.

**Complejidad:** Baja. Setup de librerías.

---

## 🎨 UX/UI

### M19. Onboarding al primer uso
**Problema:** Usuario nuevo abre la app y no sabe por dónde empezar.

**Mejora:** Tour guiado de 3-4 pasos:
1. Crea tu primera tarea
2. Configura un hábito
3. Conecta tu API key de IA
4. Planea tu primer día

**Valor:** Reduce drop-off. La gente que entiende rápido se queda.

**Complejidad:** Baja. Librería `intro.js` o componente custom.

---

### M20. Empty states con personalidad
**Problema:** Cuando no hay datos, la app se ve vacía y triste.

**Mejora:** En cada vista vacía, mensaje cálido + CTA claro:
- "Sin tareas hoy. ¿Qué tal un descanso? ☕"
- "Aún no tienes hábitos. Empieza con uno pequeño 🌱"
- "Plan vacío para mañana. ¿Quieres que la IA te sugiera? ✨"

**Valor:** Reduce la sensación de "no estoy haciendo nada". Convierte momentos vacíos en CTAs.

**Complejidad:** Baja.

---

## Priorización recomendada

Si solo pudieras hacer 5 cosas en el próximo sprint:

| # | Mejora | Por qué |
|---|---|---|
| 1 | M2 — Marcar tareas del plan como completadas | Cierra el ciclo de uso diario. Sin esto, el plan es solo una intención. |
| 2 | M5 — Atajos de teclado | Multiplica la velocidad de uso. Profesionaliza la app. |
| 3 | M7 — Pomodoro integrado | Trae tu vida real al app. Hace que se use más a lo largo del día. |
| 4 | M19 — Onboarding | Ayuda a nuevos usuarios. Vale para showcase/demos. |
| 5 | M8 — Generador de contenido | Tu interés explícito. Diferencia la app de otros to-do tools. |

Si tienes más tiempo:

| # | Mejora | Por qué |
|---|---|---|
| 6 | M4 — Notificaciones PWA | El gran salto a "compañero activo". |
| 7 | M6 — Inbox de captura rápida | Reduce la fricción para anotar cosas. |
| 8 | M10 — Calendario unificado | Vista panorámica que falta hoy. |
| 9 | M14+M15 — Auth + cloud | Habilita uso multi-dispositivo. |
| 10 | M12 — Google Calendar sync | Adopción real para usuarios con calendar pesado. |

---

## Anti-patrones a evitar

A medida que crece la app, evitar:

❌ **Mezclar lógica de UI y datos en el mismo componente** (como pasó en Routine.jsx). Extraer a hooks.

❌ **Estados booleanos múltiples para representar lo mismo** (`showForm` + `editingTask`). Usar un solo estado tipo discriminated union.

❌ **Comentarios sobre el "qué" del código**. Solo escribir comentarios sobre el "por qué" (decisiones no obvias).

❌ **Reinventar componentes UI cada vez**. Si el `<Card>` no se ajusta, mejórelo en lugar de duplicarlo.

❌ **Acumular `TODO` sin priorizarlos**. Usar el sistema de tracking (este documento).

❌ **Lanzar features sin dogfooding**. Cada feature nueva debe usarse al menos una semana antes de "darla por hecha".
