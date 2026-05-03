# Quark Habits

Personal assistant dashboard para gestión integral de hábitos, tareas y rutinas diarias.

## Qué es

Aplicación web full-stack que integra:
- **Gestión de Hábitos**: Seguimiento y evolución de comportamientos recurrentes
- **Tareas**: Organización de actividades con tracking de progreso
- **Calendario**: Visualización temporal de eventos y hitos
- **Rutinas**: Flujos predefinidos de actividades
- **Progreso**: Análisis y reportes de desempeño
- **Contenido**: Biblioteca de recursos educativos
- **IA**: Asistente inteligente para sugerencias y análisis
- **Dashboard**: Panel central con KPIs y estado general

## Por qué es bueno

✅ **Centralizado**: Todo en un lugar — hábitos, tareas, rutinas, análisis  
✅ **Inteligente**: Integración IA para recomendaciones personalizadas  
✅ **Tracking Real-time**: Seguimiento inmediato de progreso con reportes  
✅ **Flexible**: Múltiples vistas (diaria, semanal, mensual) según necesidad  
✅ **Autenticado**: Datos seguros con Supabase + JWT  
✅ **Responsivo**: Frontend moderno con React + TailwindCSS  
✅ **Escalable**: Backend separado con API REST clara  

## Stack Técnico

### Backend
- **Runtime**: Node.js + Express.js
- **BD**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: JWT + bcrypt
- **Extras**: CORS, dotenv, node-fetch

### Frontend
- **Framework**: React 18 + Vite
- **Estilos**: TailwindCSS + PostCSS
- **Routing**: React Router v6
- **Animaciones**: Framer Motion
- **State**: React Context (Auth)
- **UI**: Lucide React (iconos)
- **Notificaciones**: React Hot Toast
- **Dates**: date-fns

## Estructura

```
.
├── backend/
│   ├── src/
│   │   ├── app.js          (configuración Express)
│   │   ├── middleware/     (auth, cors, etc)
│   │   ├── routes/         (endpoints)
│   │   └── services/       (lógica negocio)
│   ├── prisma/             (esquema, migraciones)
│   └── server.js           (entry point)
├── frontend/
│   ├── src/
│   │   ├── pages/          (vistas principales)
│   │   ├── components/     (UI reutilizable)
│   │   ├── contexts/       (AuthContext, etc)
│   │   ├── hooks/          (custom hooks)
│   │   ├── api/            (cliente HTTP)
│   │   ├── lib/            (utilidades)
│   │   └── App.jsx         (router principal)
│   ├── vite.config.js
│   └── tailwind.config.js
├── docs/                   (documentación)
└── README.md               (este archivo)
```

## Instalación

### Requisitos
- Node.js 18+
- npm o yarn
- Base de datos Supabase configurada

### Setup Backend
```bash
cd backend
npm install
cp .env.example .env          # Configurar variables
npm run db:generate
npm run db:migrate
npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend estará en `http://localhost:5173`  
Backend en `http://localhost:3000`

## Scripts Disponibles

### Backend
```bash
npm run dev         # Modo desarrollo con nodemon
npm start           # Producción
npm run db:migrate  # Ejecutar migraciones Prisma
npm run db:generate # Regenerar cliente Prisma
npm run db:seed     # Seed inicial BD
```

### Frontend
```bash
npm run dev         # Dev server Vite
npm run build       # Build producción
npm run preview     # Preview build local
```

## Endpoints Principales

- `GET /api/auth/user` — Usuario actual
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET/POST /api/habits` — CRUD hábitos
- `GET/POST /api/tasks` — CRUD tareas
- `GET/POST /api/routines` — CRUD rutinas
- `GET /api/reports` — Reportes/analytics
- `GET /api/events` — Eventos/calendario
- `POST /api/ai/suggest` — Sugerencias IA

## Variables de Entorno

Backend (`.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secret_aqui
SUPABASE_URL=https://...
SUPABASE_KEY=tu_key_aqui
NODE_ENV=development
```

Frontend (`.env.local`):
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_KEY=tu_key_aqui
```

## Autenticación

Sistema JWT:
1. Usuario login → servidor valida credenciales
2. Servidor emite JWT + refresh token
3. Frontend almacena en sessionStorage
4. Requests incluyen `Authorization: Bearer <token>`
5. Middleware valida en cada endpoint

Datos seguros con bcrypt hashing + Supabase RLS.

## Deploy

### Vercel (Frontend)
```bash
vercel deploy
```
Config en `frontend/vercel.json`

### Heroku/Railway (Backend)
```bash
heroku create
git push heroku main
```

## Desarrollo

### Agregar feature nueva
1. Crear ruta en `backend/src/routes/[feature].js`
2. Crear service en `backend/src/services/`
3. Crear página en `frontend/src/pages/[Feature].jsx`
4. Importar en `App.jsx` y agregar ruta
5. Crear componentes necesarios en `frontend/src/components/`

### Testing
Por definir. Considerar Jest/Vitest para unitarios.

## Issues & Mejoras

Contribuciones bienvenidas. Para bugs o features:
1. Abrir issue en repo
2. Fork, crear feature branch
3. Submit PR

## Licencia

Privado. Proyecto personal.

---

Creado con ❤️ para optimizar productividad personal.
