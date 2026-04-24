const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const tasksRouter = require('./routes/tasks');
const habitsRouter = require('./routes/habits');
const eventsRouter = require('./routes/events');
const routineRouter = require('./routes/routine');
const aiRouter = require('./routes/ai');

const app = express();

// CORS — allow Vite dev server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/routine', routineRouter);
app.use('/api/ai', aiRouter);

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found`, status: 404 });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
