const { Router } = require('express');
const routineService = require('../services/routineService');

const router = Router();

// GET /api/routine
router.get('/', async (req, res, next) => {
  try {
    const blocks = await routineService.getAllRoutineBlocks(req.user.id, req.query);
    res.json(blocks);
  } catch (err) {
    next(err);
  }
});

// GET /api/routine/:id
router.get('/:id', async (req, res, next) => {
  try {
    const block = await routineService.getRoutineBlockById(req.user.id, req.params.id);
    if (!block) return res.status(404).json({ error: 'Routine block not found', status: 404 });
    res.json(block);
  } catch (err) {
    next(err);
  }
});

// POST /api/routine
router.post('/', async (req, res, next) => {
  try {
    const block = await routineService.createRoutineBlock(req.user.id, req.body);
    res.status(201).json(block);
  } catch (err) {
    next(err);
  }
});

// PUT /api/routine/:id
router.put('/:id', async (req, res, next) => {
  try {
    const block = await routineService.updateRoutineBlock(req.user.id, req.params.id, req.body);
    if (!block) return res.status(404).json({ error: 'Routine block not found', status: 404 });
    res.json(block);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/routine/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await routineService.deleteRoutineBlock(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Routine block not found', status: 404 });
    res.json({ message: 'Routine block deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
