const { Router } = require('express');
const habitService = require('../services/habitService');

const router = Router();

// GET /api/habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await habitService.getAllHabits();
    res.json(habits);
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/:id
router.get('/:id', async (req, res, next) => {
  try {
    const habit = await habitService.getHabitById(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found', status: 404 });
    res.json(habit);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', async (req, res, next) => {
  try {
    const habit = await habitService.createHabit(req.body);
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id
router.put('/:id', async (req, res, next) => {
  try {
    const habit = await habitService.updateHabit(req.params.id, req.body);
    if (!habit) return res.status(404).json({ error: 'Habit not found', status: 404 });
    res.json(habit);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await habitService.deleteHabit(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Habit not found', status: 404 });
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/:id/log
router.post('/:id/log', async (req, res, next) => {
  try {
    const { date, completed } = req.body;
    const result = await habitService.logHabit(req.params.id, date, completed);
    if (!result) return res.status(404).json({ error: 'Habit not found', status: 404 });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const stats = await habitService.getHabitStats(req.params.id);
    if (!stats) return res.status(404).json({ error: 'Habit not found', status: 404 });
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
