const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAllTasks(userId, filters = {}) {
  const where = { userId };

  if (filters.completed !== undefined) {
    where.completed = filters.completed === 'true' || filters.completed === true;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.category) {
    where.category = filters.category;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
  });

  return tasks.map(parseTask);
}

async function getTaskById(userId, id) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return null;
  return parseTask(task);
}

async function createTask(userId, data) {
  const { title, description, priority, category, tags, dueDate } = data;

  if (!title || title.trim() === '') {
    const err = new Error('title is required');
    err.status = 400;
    throw err;
  }

  const validPriorities = ['high', 'medium', 'low'];
  if (priority && !validPriorities.includes(priority)) {
    const err = new Error(`priority must be one of: ${validPriorities.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: title.trim(),
      description: description || null,
      priority: priority || 'medium',
      category: category || null,
      tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return parseTask(task);
}

async function updateTask(userId, id, data) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const { title, description, completed, priority, category, tags, dueDate } = data;

  if (title !== undefined && title.trim() === '') {
    const err = new Error('title cannot be empty');
    err.status = 400;
    throw err;
  }

  const validPriorities = ['high', 'medium', 'low'];
  if (priority !== undefined && !validPriorities.includes(priority)) {
    const err = new Error(`priority must be one of: ${validPriorities.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description;
  if (completed !== undefined) updateData.completed = Boolean(completed);
  if (priority !== undefined) updateData.priority = priority;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) {
    updateData.tags = tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null;
  }
  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }

  const task = await prisma.task.update({ where: { id: existing.id }, data: updateData });
  return parseTask(task);
}

async function completeTask(userId, id) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { completed: !existing.completed },
  });
  return parseTask(task);
}

async function deleteTask(userId, id) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.task.delete({ where: { id: existing.id } });
  return true;
}

function parseTask(task) {
  return {
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
  };
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
};
