const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get('/weekly.html', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start, end } = weekRange();
    const monday = start.toISOString().slice(0, 10);
    const sunday = end.toISOString().slice(0, 10);

    const [tasksDone, tasksTotal, habits, events, routineDone, routineTotal] = await Promise.all([
      prisma.task.count({ where: { userId, completed: true, updatedAt: { gte: start, lte: end } } }),
      prisma.task.count({ where: { userId, createdAt: { lte: end } } }),
      prisma.habit.findMany({ where: { userId }, include: { logs: true }, orderBy: { createdAt: 'asc' } }),
      prisma.event.findMany({
        where: { userId, startTime: { gte: start, lte: end } },
        orderBy: { startTime: 'asc' },
      }),
      prisma.routineBlock.count({ where: { userId, completed: true, planDate: { gte: monday, lte: sunday } } }),
      prisma.routineBlock.count({ where: { userId, planDate: { gte: monday, lte: sunday } } }),
    ]);

    const habitRows = habits
      .map((h) => {
        const completed = (h.logs || []).filter((l) => l.completed && l.date >= monday && l.date <= sunday).length;
        return `<tr><td>${h.name}</td><td>${completed}/7</td><td>${h.streak || 0}</td></tr>`;
      })
      .join('');

    const eventRows = events
      .map((e) => `<li><strong>${new Date(e.startTime).toLocaleString()}</strong> - ${e.title}</li>`)
      .join('');

    const html = `<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /><title>Reporte semanal</title>
<style>body{font-family:Arial,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#111}h1{margin-bottom:.3rem}table{width:100%;border-collapse:collapse;margin-top:1rem}th,td{border:1px solid #ddd;padding:.6rem;text-align:left}th{background:#f7f7f7}.kpis{display:flex;gap:1rem;flex-wrap:wrap}.kpi{border:1px solid #ddd;border-radius:8px;padding:.8rem 1rem;min-width:180px}</style>
</head><body>
<h1>Reporte semanal de habitos</h1>
<p>Semana: ${monday} a ${sunday}</p>
<div class="kpis">
  <div class="kpi"><strong>Tareas completadas:</strong><br/>${tasksDone}</div>
  <div class="kpi"><strong>Tareas totales:</strong><br/>${tasksTotal}</div>
  <div class="kpi"><strong>Bloques rutina completados:</strong><br/>${routineDone}/${routineTotal}</div>
</div>
<h2>Habitos</h2>
<table><thead><tr><th>Habito</th><th>Completado semana</th><th>Racha actual</th></tr></thead><tbody>${habitRows || '<tr><td colspan="3">Sin habitos</td></tr>'}</tbody></table>
<h2>Eventos</h2>
<ul>${eventRows || '<li>Sin eventos esta semana</li>'}</ul>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${monday}.html"`);
    return res.send(html);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
