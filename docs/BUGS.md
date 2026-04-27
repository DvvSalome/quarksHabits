# Bugs encontrados y arreglados — Página Rutina

Análisis del 2026-04-25.

---

## BUG #1 (CRÍTICO) — Loop de creación de tareas / formulario no se cierra

### Síntoma
Al crear una tarea:
- Aparece "Tarea agregada" en el toast
- El formulario NO se cierra
- Se crea otro formulario adicional
- El botón Cancelar no responde
- A veces se crea la tarea dos veces (duplicada)

### Logs observados
```
[handleSave] Start – {form: {activity: "kiwi", startTime: ""}, showForm: false}
[handleSave] Calling routine.create/update
[handleSave] Create response: {id: "...", title: "kiwi", ...}
[handleSave] About to close form, setting showForm to false
[handleSave] Finally, setting saving to false
[handleSave] Start – {form: {activity: "kiwi", startTime: ""}, showForm: false}  ← se llama DE NUEVO
[handleSave] Create response: {id: "...", title: "kiwi", ...}  ← otra tarea creada
```

### Causa raíz
Estado fragmentado entre `showForm` y `editingTask` con dos lugares donde se renderizaba el `TaskForm`:

1. **Form global** (controlado por `showForm`):
```jsx
{showForm && (
  <Card>
    <TaskForm onSave={handleSave} onCancel={() => setShowForm(false)} />
  </Card>
)}
```

2. **Form inline** dentro del `map` de tareas (controlado por `editingTask`):
```jsx
{tasks.map((task) =>
  editingTask?.id === task.id ? (
    <TaskForm initial={...} onSave={handleSave} onCancel={() => setEditingTask(null)} />
  ) : (
    <TaskItem ... />
  )
)}
```

Esto causaba:
- Cuando `setShowForm(false)` se llamaba, el form global se cerraba
- Pero React podía estar renderizando el form inline si por algún motivo `editingTask` quedaba en estado intermedio
- El `key` del TaskForm cambiaba entre renders, causando desmontajes/montajes que disparaban handlers múltiples
- El estado interno del TaskForm (`useState` con `initial`) se reseteaba al re-montarse, pero podía conservar handlers pendientes en closures viejos

### Solución aplicada
**Estado unificado** — un solo state `formState` con tres valores posibles:
- `null` → formulario cerrado
- `'new'` → creando nueva tarea
- `{ task }` → editando tarea específica

**Una sola instancia del formulario** — se renderiza UNA VEZ al final del JSX, como modal:
```jsx
{formState && (
  <TaskFormModal
    mode={isEditing ? 'edit' : 'new'}
    initial={formInitial}
    onSave={handleSave}
    onCancel={closeForm}
    saving={saving}
  />
)}
```

**Modal con `<form>` y `e.preventDefault()`** — evita propagación de eventos y permite usar Enter de forma controlada.

**Guard contra doble llamada** en `handleSave`:
```js
if (saving) return  // ← previene doble submit
```

### Archivos modificados
- `frontend/src/pages/Routine.jsx` (reescritura completa)

---

## BUG #2 (CRÍTICO) — Variable `tasks` sombreada en map

### Síntoma
Bug latente. No causaba error visible pero podía causar comportamiento incorrecto si se referenciaba `tasks` (el hook) dentro del map.

### Causa
```jsx
const tasks = useTasks()  // ← hook con .data, .toggle, etc.

// ... más adelante:
{['morning', 'afternoon', ...].map((period) => {
  const tasks = tasksByPeriod[period]  // ← SOMBREA el hook
  return (
    <Card>
      {tasks.map(...)}  // ← ¿es array o hook? Confuso
    </Card>
  )
})}
```

### Solución aplicada
Renombrado del hook a `tasksHook` para evitar conflicto, y el array dentro del map se llama `periodTasks`:
```js
const tasksHook = useTasks()
// ...
const periodTasks = tasksByPeriod[period]
```

---

## BUG #3 (ALTO) — `localeCompare` en valor null

### Síntoma
JavaScript error: `Cannot read property 'localeCompare' of null` cuando se ordenaban tareas con `startTime = null` (tareas sin hora).

### Causa
```js
.sort((a, b) => a.startTime.localeCompare(b.startTime))
```

`a.startTime` podía ser `null` cuando una tarea no tenía hora. `null.localeCompare(...)` lanza error.

### Solución aplicada
Coalescing a string vacío antes de comparar:
```js
.sort((a, b) => {
  const aTime = a.startTime || ''
  const bTime = b.startTime || ''
  return aTime.localeCompare(bTime)
})
```

### Archivos modificados
- `frontend/src/hooks/useRoutine.js` (en `create` y `update`)
- `frontend/src/pages/Dashboard.jsx` (en `todayPlan`)

---

## BUG #4 (ALTO) — Schema de Prisma rechazaba `startTime: null`

### Síntoma
Backend devolvía 500 al crear una tarea sin hora:
```
Argument `startTime` must not be null
```

### Causa
En el schema de Prisma, `startTime` y `endTime` estaban marcados como `String` (no nullable):
```prisma
startTime String
endTime   String
```

### Solución aplicada
Marcar ambos campos como nullable en el schema:
```prisma
startTime String?
endTime   String?
```

Ejecutado migration: `20260425_make_startTime_optional`.

### Archivos modificados
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260425..._make_startTime_optional/migration.sql` (nuevo)

---

## BUG #5 (MEDIO) — Endpoint `/api/ai/review` no encontrado

### Síntoma
Al clicar "Generar resumen" en la página de Progreso, error: `Route POST / not found`.

### Causa
El servidor backend estaba corriendo una versión vieja que no incluía el nuevo endpoint `/api/ai/review`. Las rutas estaban correctamente definidas en el código, pero Node necesitaba reiniciarse para cargarlas.

### Solución aplicada
Reinicio del servidor: `pkill -f "node server.js" && npm start`.

**Recomendación:** usar `nodemon` (ya configurado en package.json del backend) en desarrollo para recarga automática:
```bash
npm run dev  # ← usa nodemon
```
en lugar de `npm start` (que usa `node` directo).

---

## BUG #6 (BAJO) — Validación de `startTime`/`endTime` requeridos en createRoutineBlock

### Síntoma
Backend rechazaba creación de tareas sin hora porque la validación seguía marcando `startTime` como obligatorio.

### Causa
```js
if (!startTime || !validateTimeFormat(startTime)) {
  throw new Error('startTime is required')
}
```

### Solución aplicada
Validación condicional — solo valida formato si `startTime` está presente:
```js
if (startTime && !validateTimeFormat(startTime)) {
  throw new Error('startTime must be in HH:MM format')
}
```

`endTime` se eliminó del flujo de creación (siempre `null` para plan blocks).

### Archivos modificados
- `backend/src/services/routineService.js`

---

## Resumen ejecutivo

| Bug | Severidad | Estado | Archivos |
|---|---|---|---|
| #1 — Loop de formulario | CRÍTICO | ✅ Arreglado | Routine.jsx |
| #2 — Shadowing `tasks` | CRÍTICO | ✅ Arreglado | Routine.jsx |
| #3 — localeCompare null | ALTO | ✅ Arreglado | useRoutine.js, Dashboard.jsx |
| #4 — startTime no nullable | ALTO | ✅ Arreglado | schema.prisma |
| #5 — Endpoint no cargado | MEDIO | ✅ Arreglado | (reinicio servidor) |
| #6 — Validación bloqueante | BAJO | ✅ Arreglado | routineService.js |

## Cómo evitar estos bugs en el futuro

1. **Nunca duplicar componentes con estado** en distintos lugares del JSX. Si necesitas mostrar el mismo formulario en modos diferentes (crear/editar), centralízalo en un único lugar.

2. **Nunca usar el mismo nombre para variables del scope superior y dentro de loops**. Usa convenciones como `<thing>Hook` para hooks, `<thing>Item` para elementos del map.

3. **Siempre coalescer null en ordenamientos**. `.sort()` debe ser robusto a campos opcionales.

4. **Schema de Prisma debe reflejar la realidad de los datos**. Si un campo puede ser null en algunos casos, marcarlo como `String?` desde el inicio.

5. **Usar `nodemon` en desarrollo** para evitar olvidar reiniciar el servidor tras cambios.

6. **Guards en handlers async** (`if (saving) return`) para prevenir submits dobles por dobles clicks o eventos duplicados.
