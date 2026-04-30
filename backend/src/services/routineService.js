const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function computeTimeSlot(startTime) {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function validateTimeFormat(str) {
  return /^\d{2}:\d{2}$/.test(str);
}

async function getAllRoutineBlocks(userId, filters = {}) {
  const where = { userId };

  if (filters.planDate) {
    // Daily plan mode: return blocks for a specific date
    where.planDate = filters.planDate;
  } else {
    // Legacy mode: return non-plan blocks
    where.planDate = null;
    if (filters.timeSlot) where.timeSlot = filters.timeSlot;
  }

  return prisma.routineBlock.findMany({
    where,
    orderBy: [{ startTime: 'asc' }, { order: 'asc' }],
  });
}

async function getRoutineBlockById(userId, id) {
  return prisma.routineBlock.findFirst({ where: { id, userId } });
}

async function createRoutineBlock(userId, data) {
  const { startTime, activity, planDate, title, timeSlot, recurring, dayOfWeek, order } = data;

  if (!activity || activity.trim() === '') {
    const err = new Error('activity is required');
    err.status = 400;
    throw err;
  }

  // Validate startTime if provided
  if (startTime && !validateTimeFormat(startTime)) {
    const err = new Error('startTime must be in HH:MM format');
    err.status = 400;
    throw err;
  }

  // Plan blocks (with planDate) auto-compute timeSlot from startTime (if provided)
  const resolvedTimeSlot = planDate
    ? (startTime ? computeTimeSlot(startTime) : 'morning')
    : (timeSlot || (startTime ? computeTimeSlot(startTime) : 'morning'));
  const resolvedTitle = (title && title.trim()) || activity.trim();

  const dayOfWeekStr =
    dayOfWeek != null
      ? Array.isArray(dayOfWeek) ? JSON.stringify(dayOfWeek) : dayOfWeek
      : 'all';

  return prisma.routineBlock.create({
    data: {
      userId,
      title: resolvedTitle,
      timeSlot: resolvedTimeSlot,
      startTime: startTime || null,
      endTime: null,
      activity: activity.trim(),
      recurring: planDate ? false : (recurring !== undefined ? Boolean(recurring) : true),
      dayOfWeek: planDate ? null : dayOfWeekStr,
      planDate: planDate || null,
      order: order !== undefined ? Number(order) : 0,
    },
  });
}

async function updateRoutineBlock(userId, id, data) {
  const existing = await prisma.routineBlock.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const { title, timeSlot, startTime, activity, recurring, dayOfWeek, order, planDate, completed } = data;

  if (startTime !== undefined && startTime !== null && !validateTimeFormat(startTime)) {
    const err = new Error('startTime must be in HH:MM format');
    err.status = 400;
    throw err;
  }
  if (activity !== undefined && activity.trim() === '') {
    const err = new Error('activity cannot be empty');
    err.status = 400;
    throw err;
  }

  const updateData = {};
  if (activity !== undefined) {
    updateData.activity = activity.trim();
    updateData.title = (title && title.trim()) || activity.trim();
  } else if (title !== undefined) {
    updateData.title = title.trim();
  }
  if (startTime !== undefined) {
    updateData.startTime = startTime;
    // Re-compute timeSlot if it's a plan block and startTime is provided
    if (existing.planDate && startTime) {
      updateData.timeSlot = computeTimeSlot(startTime);
    } else if (existing.planDate && !startTime) {
      updateData.timeSlot = 'morning';
    }
  }
  if (timeSlot !== undefined && !existing.planDate) updateData.timeSlot = timeSlot;
  if (recurring !== undefined) updateData.recurring = Boolean(recurring);
  if (dayOfWeek !== undefined) {
    updateData.dayOfWeek = Array.isArray(dayOfWeek) ? JSON.stringify(dayOfWeek) : dayOfWeek;
  }
  if (planDate !== undefined) updateData.planDate = planDate;
  if (order !== undefined) updateData.order = Number(order);
  if (completed !== undefined) {
    updateData.completed = Boolean(completed);
    updateData.completedAt = completed ? new Date() : null;
  }

  return prisma.routineBlock.update({ where: { id: existing.id }, data: updateData });
}

async function deleteRoutineBlock(userId, id) {
  const existing = await prisma.routineBlock.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.routineBlock.delete({ where: { id: existing.id } });
  return true;
}

module.exports = {
  getAllRoutineBlocks,
  getRoutineBlockById,
  createRoutineBlock,
  updateRoutineBlock,
  deleteRoutineBlock,
};
