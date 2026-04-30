const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAllContents(userId) {
  return prisma.content.findMany({
    where: { userId },
    orderBy: [{ starred: 'desc' }, { createdAt: 'desc' }],
  });
}

async function getContentById(userId, id) {
  return prisma.content.findFirst({ where: { id, userId } });
}

async function createContent(userId, data) {
  const { templateType, topic, audience, tone, body } = data;

  if (!templateType || !topic || !body) {
    const err = new Error('templateType, topic y body son requeridos');
    err.status = 400;
    throw err;
  }

  return prisma.content.create({
    data: {
      userId,
      templateType,
      topic: topic.trim(),
      audience: audience?.trim() || null,
      tone: tone?.trim() || null,
      body,
    },
  });
}

async function updateContent(userId, id, data) {
  const existing = await prisma.content.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const updateData = {};
  if (data.body !== undefined) updateData.body = data.body;
  if (data.starred !== undefined) updateData.starred = Boolean(data.starred);
  if (data.topic !== undefined) updateData.topic = data.topic.trim();

  return prisma.content.update({ where: { id: existing.id }, data: updateData });
}

async function deleteContent(userId, id) {
  const existing = await prisma.content.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.content.delete({ where: { id: existing.id } });
  return true;
}

module.exports = {
  getAllContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
};
