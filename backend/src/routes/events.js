const { Router } = require('express');
const eventService = require('../services/eventService');

const router = Router();

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents(req.query);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found', status: 404 });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// POST /api/events
router.post('/', async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id
router.put('/:id', async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    if (!event) return res.status(404).json({ error: 'Event not found', status: 404 });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await eventService.deleteEvent(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Event not found', status: 404 });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
