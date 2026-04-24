const { Router } = require('express');
const aiService = require('../services/aiService');

const router = Router();

// POST /api/ai/suggest — structured daily analysis
router.post('/suggest', async (req, res, next) => {
  try {
    const { apiKey, model, provider, tasks, habits, events, date } = req.body;
    const suggestions = await aiService.getSuggestions({ apiKey, model, provider, tasks, habits, events, date });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat — free-form chat with user context
router.post('/chat', async (req, res, next) => {
  try {
    const { apiKey, model, provider, messages, context } = req.body;
    const reply = await aiService.getChatReply({ apiKey, model, provider, messages, context });
    res.json(reply);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
