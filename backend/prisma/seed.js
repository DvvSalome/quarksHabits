const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function today(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

function dateStr(offsetDays = 0) {
  return today(offsetDays).toISOString().slice(0, 10);
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data (safe for dev)
  await prisma.habitLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.task.deleteMany();
  await prisma.event.deleteMany();
  await prisma.routineBlock.deleteMany();

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Revisar correos importantes',
        description: 'Responder a los correos pendientes de la semana',
        priority: 'high',
        category: 'Trabajo',
        tags: JSON.stringify(['correo', 'comunicación']),
        dueDate: today(0),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Preparar presentación del proyecto',
        description: 'Slides para la reunión del jueves con el equipo',
        priority: 'high',
        category: 'Trabajo',
        tags: JSON.stringify(['presentación', 'proyecto']),
        dueDate: today(2),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Hacer la compra semanal',
        description: 'Frutas, verduras, proteínas y snacks saludables',
        priority: 'medium',
        category: 'Personal',
        tags: JSON.stringify(['hogar', 'alimentación']),
        dueDate: today(1),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Llamar al médico para cita',
        priority: 'medium',
        category: 'Salud',
        tags: JSON.stringify(['salud']),
        dueDate: today(3),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Leer capítulo del libro',
        description: 'Continuar con "Atomic Habits" — capítulo 8',
        priority: 'low',
        category: 'Desarrollo personal',
        tags: JSON.stringify(['lectura', 'hábitos']),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Organizar escritorio',
        description: 'Limpiar y organizar el espacio de trabajo',
        priority: 'low',
        category: 'Personal',
        completed: true,
        tags: JSON.stringify(['organización']),
      },
    }),
  ]);

  console.log(`Created ${tasks.length} tasks`);

  // ─── Habits ───────────────────────────────────────────────────────────────
  const habitMeditar = await prisma.habit.create({
    data: {
      name: 'Meditar',
      frequency: 'daily',
      color: '#8b5cf6',
      icon: '🧘',
      streak: 0,
    },
  });

  const habitEjercicio = await prisma.habit.create({
    data: {
      name: 'Ejercicio',
      frequency: 'daily',
      color: '#10b981',
      icon: '💪',
      streak: 0,
    },
  });

  const habitLectura = await prisma.habit.create({
    data: {
      name: 'Lectura 30 min',
      frequency: 'daily',
      color: '#f59e0b',
      icon: '📚',
      streak: 0,
    },
  });

  const habitAgua = await prisma.habit.create({
    data: {
      name: 'Beber 2L de agua',
      frequency: 'daily',
      color: '#06b6d4',
      icon: '💧',
      streak: 0,
    },
  });

  const habitRevision = await prisma.habit.create({
    data: {
      name: 'Revisión semanal',
      frequency: 'weekly',
      color: '#6366f1',
      icon: '📋',
      streak: 0,
    },
  });

  // Seed habit logs for the last 7 days
  const habitLogData = [];

  for (let i = 6; i >= 0; i--) {
    const d = dateStr(-i);

    // Meditar — completed 5 of last 7 days
    habitLogData.push({
      habitId: habitMeditar.id,
      date: d,
      completed: i !== 2 && i !== 5,
    });

    // Ejercicio — completed 4 of last 7 days
    habitLogData.push({
      habitId: habitEjercicio.id,
      date: d,
      completed: i !== 1 && i !== 3 && i !== 6,
    });

    // Lectura — completed last 3 days consecutively
    habitLogData.push({
      habitId: habitLectura.id,
      date: d,
      completed: i <= 2,
    });

    // Agua — all 7 days
    habitLogData.push({
      habitId: habitAgua.id,
      date: d,
      completed: true,
    });
  }

  // Weekly revision — completed last week
  habitLogData.push({
    habitId: habitRevision.id,
    date: dateStr(-7),
    completed: true,
  });

  await prisma.habitLog.createMany({ data: habitLogData });

  // Update streak counts on habits
  const allHabits = [habitMeditar, habitEjercicio, habitLectura, habitAgua, habitRevision];
  for (const habit of allHabits) {
    const logs = await prisma.habitLog.findMany({ where: { habitId: habit.id } });
    const streak = computeStreak(logs);
    await prisma.habit.update({ where: { id: habit.id }, data: { streak } });
  }

  console.log('Created 5 habits with logs');

  // ─── Events ───────────────────────────────────────────────────────────────
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Stand-up diario',
        description: 'Reunión de equipo — actualizaciones de estado',
        startTime: new Date(today(0).toISOString().slice(0, 10) + 'T09:00:00.000Z'),
        endTime: new Date(today(0).toISOString().slice(0, 10) + 'T09:30:00.000Z'),
        allDay: false,
        color: '#6366f1',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Sesión de trabajo profundo',
        description: 'Bloque de concentración sin interrupciones',
        startTime: new Date(today(0).toISOString().slice(0, 10) + 'T10:00:00.000Z'),
        endTime: new Date(today(0).toISOString().slice(0, 10) + 'T12:00:00.000Z'),
        allDay: false,
        color: '#8b5cf6',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Comida con equipo',
        startTime: new Date(today(0).toISOString().slice(0, 10) + 'T13:00:00.000Z'),
        endTime: new Date(today(0).toISOString().slice(0, 10) + 'T14:00:00.000Z'),
        allDay: false,
        color: '#10b981',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Revisión de proyecto',
        description: 'Presentación de avances al cliente',
        startTime: new Date(today(2).toISOString().slice(0, 10) + 'T16:00:00.000Z'),
        endTime: new Date(today(2).toISOString().slice(0, 10) + 'T17:00:00.000Z'),
        allDay: false,
        color: '#f59e0b',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Día libre',
        description: 'Vacaciones — sin compromisos laborales',
        startTime: new Date(today(5).toISOString().slice(0, 10) + 'T00:00:00.000Z'),
        allDay: true,
        color: '#06b6d4',
      },
    }),
  ]);

  console.log(`Created ${events.length} events`);

  // ─── Routine Blocks ───────────────────────────────────────────────────────
  const routineBlocks = await Promise.all([
    prisma.routineBlock.create({
      data: {
        title: 'Despertar y rutina matutina',
        timeSlot: 'morning',
        startTime: '06:30',
        endTime: '07:00',
        activity: 'Levantarse, hidratarse y preparar el día',
        recurring: true,
        dayOfWeek: 'all',
        order: 0,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Meditación',
        timeSlot: 'morning',
        startTime: '07:00',
        endTime: '07:20',
        activity: 'Meditación guiada o mindfulness',
        recurring: true,
        dayOfWeek: 'all',
        order: 1,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Ejercicio',
        timeSlot: 'morning',
        startTime: '07:30',
        endTime: '08:30',
        activity: 'Entrenamiento: cardio o fuerza',
        recurring: true,
        dayOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        order: 2,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Desayuno y planificación del día',
        timeSlot: 'morning',
        startTime: '08:30',
        endTime: '09:00',
        activity: 'Desayuno saludable y repaso de tareas del día',
        recurring: true,
        dayOfWeek: 'all',
        order: 3,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Trabajo profundo — bloque 1',
        timeSlot: 'morning',
        startTime: '09:00',
        endTime: '11:00',
        activity: 'Tareas de alta prioridad y máxima concentración',
        recurring: true,
        dayOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        order: 4,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Reuniones y comunicación',
        timeSlot: 'afternoon',
        startTime: '11:00',
        endTime: '13:00',
        activity: 'Llamadas, correos y reuniones de equipo',
        recurring: true,
        dayOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        order: 0,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Comida y descanso',
        timeSlot: 'afternoon',
        startTime: '13:00',
        endTime: '14:00',
        activity: 'Comida y pausa activa — sin pantallas',
        recurring: true,
        dayOfWeek: 'all',
        order: 1,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Trabajo profundo — bloque 2',
        timeSlot: 'afternoon',
        startTime: '14:00',
        endTime: '17:00',
        activity: 'Proyectos y tareas de desarrollo',
        recurring: true,
        dayOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        order: 2,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Revisión del día y cierre',
        timeSlot: 'evening',
        startTime: '17:00',
        endTime: '17:30',
        activity: 'Revisar tareas completadas y preparar el día siguiente',
        recurring: true,
        dayOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        order: 0,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Lectura',
        timeSlot: 'evening',
        startTime: '21:00',
        endTime: '21:30',
        activity: 'Lectura de libro (no pantallas brillantes)',
        recurring: true,
        dayOfWeek: 'all',
        order: 1,
      },
    }),
    prisma.routineBlock.create({
      data: {
        title: 'Rutina de sueño',
        timeSlot: 'evening',
        startTime: '22:30',
        endTime: '23:00',
        activity: 'Preparación para dormir — sin móvil, ambiente tranquilo',
        recurring: true,
        dayOfWeek: 'all',
        order: 2,
      },
    }),
  ]);

  console.log(`Created ${routineBlocks.length} routine blocks`);
  console.log('Seed complete!');
}

// Same streak logic as in habitService.js
function computeStreak(logs) {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let cursor = todayStr;

  for (const date of completedDates) {
    if (date === cursor) {
      streak++;
      cursor = prevDay(cursor);
    } else if (date < cursor) {
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

function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
