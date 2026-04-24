const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_TIME_SLOTS = ['morning', 'afternoon', 'evening'];

function validateTimeFormat(str) {
  return /^\d{2}:\d{2}$/.test(str);
}

async function getAllRoutineBlocks(filters = {}) {
  const where = {};
  if (filters.timeSlot) {
    where.timeSlot = filters.timeSlot;
  }

  return prisma.routineBlock.findMany({
    where,
    orderBy: [{ timeSlot: 'asc' }, { order: 'asc' }, { startTime: 'asc' }],
  });
}

async function getRoutineBlockById(id) {
  return prisma.routineBlock.findUnique({ where: { id } });
}

async function createRoutineBlock(data) {
  const { title, timeSlot, startTime, endTime, activity, recurring, dayOfWeek, order } = data;

  if (!title || title.trim() === '') {
    const err = new Error('title is required');
    err.status = 400;
    throw err;
  }
  if (!timeSlot || !VALID_TIME_SLOTS.includes(timeSlot)) {
    const err = new Error(`timeSlot must be one of: ${VALID_TIME_SLOTS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (!startTime || !validateTimeFormat(startTime)) {
    const err = new Error('startTime is required and must be in HH:MM format');
    err.status = 400;
    throw err;
  }
  if (!endTime || !validateTimeFormat(endTime)) {
    const err = new Error('endTime is required and must be in HH:MM format');
    err.status = 400;
    throw err;
  }
  if (!activity || activity.trim() === '') {
    const err = new Error('activity is required');
    err.status = 400;
    throw err;
  }

  const dayOfWeekStr =
    dayOfWeek != null
      ? Array.isArray(dayOfWeek)
        ? JSON.stringify(dayOfWeek)
        : dayOfWeek
      : 'all';

  return prisma.routineBlock.create({
    data: {
      title: title.trim(),
      timeSlot,
      startTime,
      endTime,
      activity: activity.trim(),
      recurring: recurring !== undefined ? Boolean(recurring) : true,
      dayOfWeek: dayOfWeekStr,
      order: order !== undefined ? Number(order) : 0,
    },
  });
}

async function updateRoutineBlock(id, data) {
  const existing = await prisma.routineBlock.findUnique({ where: { id } });
  if (!existing) return null;

  const { title, timeSlot, startTime, endTime, activity, recurring, dayOfWeek, order } = data;

  if (title !== undefined && title.trim() === '') {
    const err = new Error('title cannot be empty');
    err.status = 400;
    throw err;
  }
  if (timeSlot !== undefined && !VALID_TIME_SLOTS.includes(timeSlot)) {
    const err = new Error(`timeSlot must be one of: ${VALID_TIME_SLOTS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (startTime !== undefined && !validateTimeFormat(startTime)) {
    const err = new Error('startTime must be in HH:MM format');
    err.status = 400;
    throw err;
  }
  if (endTime !== undefined && !validateTimeFormat(endTime)) {
    const err = new Error('endTime must be in HH:MM format');
    err.status = 400;
    throw err;
  }
  if (activity !== undefined && activity.trim() === '') {
    const err = new Error('activity cannot be empty');
    err.status = 400;
    throw err;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
  if (startTime !== undefined) updateData.startTime = startTime;
  if (endTime !== undefined) updateData.endTime = endTime;
  if (activity !== undefined) updateData.activity = activity.trim();
  if (recurring !== undefined) updateData.recurring = Boolean(recurring);
  if (dayOfWeek !== undefined) {
    updateData.dayOfWeek = Array.isArray(dayOfWeek) ? JSON.stringify(dayOfWeek) : dayOfWeek;
  }
  if (order !== undefined) updateData.order = Number(order);

  return prisma.routineBlock.update({ where: { id }, data: updateData });
}

async function deleteRoutineBlock(id) {
  const existing = await prisma.routineBlock.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.routineBlock.delete({ where: { id } });
  return true;
}

module.exports = {
  getAllRoutineBlocks,
  getRoutineBlockById,
  createRoutineBlock,
  updateRoutineBlock,
  deleteRoutineBlock,
};
