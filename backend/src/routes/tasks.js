const { Router } = require('express');
const taskService = require('../services/taskService');

const router = Router();

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks(req.user.id, req.query);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.user.id, req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found', status: 404 });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found', status: 404 });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await taskService.completeTask(req.user.id, req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found', status: 404 });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await taskService.deleteTask(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found', status: 404 });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
