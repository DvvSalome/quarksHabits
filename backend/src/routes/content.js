const { Router } = require('express');
const contentService = require('../services/contentService');
const aiService = require('../services/aiService');

const router = Router();

// GET /api/content
router.get('/', async (req, res, next) => {
  try {
    const contents = await contentService.getAllContents();
    res.json(contents);
  } catch (err) { next(err); }
});

// GET /api/content/templates — list available templates
router.get('/templates', (req, res) => {
  const templates = Object.entries(aiService.CONTENT_TEMPLATES).map(([id, t]) => ({
    id,
    label: t.label,
  }));
  res.json({ templates });
});

// POST /api/content/generate — generate content with AI
router.post('/generate', async (req, res, next) => {
  try {
    const { apiKey, model, provider, templateType, topic, audience, tone, extraContext } = req.body;
    const result = await aiService.generateContent({
      apiKey, model, provider, templateType, topic, audience, tone, extraContext,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/content/repurpose — adapt existing content to another format
router.post('/repurpose', async (req, res, next) => {
  try {
    const { apiKey, model, provider, sourceContent, targetTemplateType } = req.body;
    const result = await aiService.repurposeContent({
      apiKey, model, provider, sourceContent, targetTemplateType,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/content — save generated content
router.post('/', async (req, res, next) => {
  try {
    const content = await contentService.createContent(req.body);
    res.status(201).json(content);
  } catch (err) { next(err); }
});

// PUT /api/content/:id
router.put('/:id', async (req, res, next) => {
  try {
    const content = await contentService.updateContent(req.params.id, req.body);
    if (!content) return res.status(404).json({ error: 'Not found', status: 404 });
    res.json(content);
  } catch (err) { next(err); }
});

// DELETE /api/content/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await contentService.deleteContent(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found', status: 404 });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
