const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAllContents() {
  return prisma.content.findMany({ orderBy: [{ starred: 'desc' }, { createdAt: 'desc' }] });
}

async function getContentById(id) {
  return prisma.content.findUnique({ where: { id } });
}

async function createContent(data) {
  const { templateType, topic, audience, tone, body } = data;

  if (!templateType || !topic || !body) {
    const err = new Error('templateType, topic y body son requeridos');
    err.status = 400;
    throw err;
  }

  return prisma.content.create({
    data: {
      templateType,
      topic: topic.trim(),
      audience: audience?.trim() || null,
      tone: tone?.trim() || null,
      body,
    },
  });
}

async function updateContent(id, data) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData = {};
  if (data.body !== undefined) updateData.body = data.body;
  if (data.starred !== undefined) updateData.starred = Boolean(data.starred);
  if (data.topic !== undefined) updateData.topic = data.topic.trim();

  return prisma.content.update({ where: { id }, data: updateData });
}

async function deleteContent(id) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.content.delete({ where: { id } });
  return true;
}

module.exports = {
  getAllContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
};
