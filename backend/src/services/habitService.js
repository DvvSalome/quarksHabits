const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function computeStreak(logs) {
  // logs: array of HabitLog sorted by date desc
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const todayStr = toDateString(today);

  let cursor = todayStr;

  for (const date of completedDates) {
    if (date === cursor) {
      streak++;
      cursor = prevDay(cursor);
    } else if (date < cursor) {
      // Check if we can still start a streak from today or yesterday
      // If first date is not today or yesterday, streak is 0
      if (streak === 0) {
        const yesterday = prevDay(todayStr);
        if (date === yesterday) {
          streak++;
          cursor = prevDay(yesterday);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  return streak;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateString(d);
}

async function getAllHabits() {
  const habits = await prisma.habit.findMany({
    include: { logs: true },
    orderBy: { createdAt: 'asc' },
  });

  return habits.map((h) => ({
    ...h,
    streak: computeStreak(h.logs),
  }));
}

async function getHabitById(id) {
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: { logs: true },
  });
  if (!habit) return null;
  return { ...habit, streak: computeStreak(habit.logs) };
}

async function createHabit(data) {
  const { name, frequency, color, icon } = data;

  if (!name || name.trim() === '') {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  const validFrequencies = ['daily', 'weekly'];
  if (frequency && !validFrequencies.includes(frequency)) {
    const err = new Error(`frequency must be one of: ${validFrequencies.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const habit = await prisma.habit.create({
    data: {
      name: name.trim(),
      frequency: frequency || 'daily',
      color: color || '#6366f1',
      icon: icon || null,
    },
    include: { logs: true },
  });

  return { ...habit, streak: 0 };
}

async function updateHabit(id, data) {
  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) return null;

  const { name, frequency, color, icon } = data;

  if (name !== undefined && name.trim() === '') {
    const err = new Error('name cannot be empty');
    err.status = 400;
    throw err;
  }

  const validFrequencies = ['daily', 'weekly'];
  if (frequency !== undefined && !validFrequencies.includes(frequency)) {
    const err = new Error(`frequency must be one of: ${validFrequencies.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (frequency !== undefined) updateData.frequency = frequency;
  if (color !== undefined) updateData.color = color;
  if (icon !== undefined) updateData.icon = icon;

  const habit = await prisma.habit.update({
    where: { id },
    data: updateData,
    include: { logs: true },
  });

  return { ...habit, streak: computeStreak(habit.logs) };
}

async function deleteHabit(id) {
  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.habit.delete({ where: { id } });
  return true;
}

async function logHabit(habitId, date, completed) {
  if (!date) {
    const err = new Error('date is required (YYYY-MM-DD)');
    err.status = 400;
    throw err;
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const err = new Error('date must be in YYYY-MM-DD format');
    err.status = 400;
    throw err;
  }

  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) return null;

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    update: { completed: Boolean(completed) },
    create: { habitId, date, completed: Boolean(completed) },
  });

  // Recompute streak
  const allLogs = await prisma.habitLog.findMany({ where: { habitId } });
  const streak = computeStreak(allLogs);

  // Update habit streak field for convenience
  await prisma.habit.update({ where: { id: habitId }, data: { streak } });

  return { log, streak };
}

async function getHabitStats(id) {
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: { logs: true },
  });
  if (!habit) return null;

  const completedLogs = habit.logs.filter((l) => l.completed);
  const totalLogs = habit.logs.length;
  const streak = computeStreak(habit.logs);

  // Completion rate over the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const thirtyStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const last30Completed = completedLogs.filter((l) => l.date >= thirtyStr).length;
  const completionRate30 = totalLogs > 0 ? Math.round((last30Completed / 30) * 100) : 0;

  // Best streak (full computation)
  const allDates = completedLogs.map((l) => l.date).sort();
  let bestStreak = 0;
  let currentBest = 0;
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      currentBest = 1;
    } else {
      const prev = new Date(allDates[i - 1] + 'T00:00:00Z');
      const curr = new Date(allDates[i] + 'T00:00:00Z');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentBest++;
      } else {
        bestStreak = Math.max(bestStreak, currentBest);
        currentBest = 1;
      }
    }
    bestStreak = Math.max(bestStreak, currentBest);
  }

  return {
    habitId: id,
    name: habit.name,
    currentStreak: streak,
    bestStreak,
    totalCompleted: completedLogs.length,
    totalLogs,
    completionRate30Days: completionRate30,
    logs: habit.logs.sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 30),
  };
}

module.exports = {
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabit,
  getHabitStats,
};
