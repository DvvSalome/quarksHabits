const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAllEvents(filters = {}) {
  const where = {};

  if (filters.from) {
    where.startTime = { ...(where.startTime || {}), gte: new Date(filters.from) };
  }
  if (filters.to) {
    where.startTime = { ...(where.startTime || {}), lte: new Date(filters.to) };
  }
  if (filters.taskId) {
    where.taskId = filters.taskId;
  }

  return prisma.event.findMany({
    where,
    orderBy: { startTime: 'asc' },
  });
}

async function getEventById(id) {
  return prisma.event.findUnique({ where: { id } });
}

async function createEvent(data) {
  const { title, description, startTime, endTime, allDay, color, taskId } = data;

  if (!title || title.trim() === '') {
    const err = new Error('title is required');
    err.status = 400;
    throw err;
  }
  if (!startTime) {
    const err = new Error('startTime is required');
    err.status = 400;
    throw err;
  }

  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    const err = new Error('startTime must be a valid date/time');
    err.status = 400;
    throw err;
  }

  let end = null;
  if (endTime) {
    end = new Date(endTime);
    if (isNaN(end.getTime())) {
      const err = new Error('endTime must be a valid date/time');
      err.status = 400;
      throw err;
    }
    if (end < start) {
      const err = new Error('endTime must be after startTime');
      err.status = 400;
      throw err;
    }
  }

  return prisma.event.create({
    data: {
      title: title.trim(),
      description: description || null,
      startTime: start,
      endTime: end,
      allDay: Boolean(allDay),
      color: color || '#6366f1',
      taskId: taskId || null,
    },
  });
}

async function updateEvent(id, data) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return null;

  const { title, description, startTime, endTime, allDay, color, taskId } = data;

  if (title !== undefined && title.trim() === '') {
    const err = new Error('title cannot be empty');
    err.status = 400;
    throw err;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description;
  if (allDay !== undefined) updateData.allDay = Boolean(allDay);
  if (color !== undefined) updateData.color = color;
  if (taskId !== undefined) updateData.taskId = taskId;

  if (startTime !== undefined) {
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      const err = new Error('startTime must be a valid date/time');
      err.status = 400;
      throw err;
    }
    updateData.startTime = start;
  }

  if (endTime !== undefined) {
    if (endTime === null || endTime === '') {
      updateData.endTime = null;
    } else {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) {
        const err = new Error('endTime must be a valid date/time');
        err.status = 400;
        throw err;
      }
      updateData.endTime = end;
    }
  }

  // Cross-field validation: if we're updating either start or end,
  // ensure the final start < end
  const finalStart = updateData.startTime ?? existing.startTime;
  const finalEnd = updateData.endTime !== undefined ? updateData.endTime : existing.endTime;
  if (finalStart && finalEnd && finalEnd < finalStart) {
    const err = new Error('endTime must be after startTime');
    err.status = 400;
    throw err;
  }

  return prisma.event.update({ where: { id }, data: updateData });
}

async function deleteEvent(id) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.event.delete({ where: { id } });
  return true;
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
