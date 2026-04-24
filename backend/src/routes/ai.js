const { Router } = require('express');
const aiService = require('../services/aiService');

const router = Router();

// POST /api/ai/suggest
router.post('/suggest', async (req, res, next) => {
  try {
    const { apiKey, model, tasks, habits, events, date } = req.body;
    const suggestions = await aiService.getSuggestions({ apiKey, model, tasks, habits, events, date });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
