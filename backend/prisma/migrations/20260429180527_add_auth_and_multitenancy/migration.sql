/*
  Warnings:

  - Added the required column `userId` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Habit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `RoutineBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "User" ("id", "email", "passwordHash", "name", "updatedAt")
VALUES ("legacy-user", "legacy@local", "legacy-no-login", "Legacy User", CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "audience" TEXT,
    "tone" TEXT,
    "body" TEXT NOT NULL,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Content" ("audience", "body", "createdAt", "id", "starred", "templateType", "tone", "topic", "updatedAt", "userId") SELECT "audience", "body", "createdAt", "id", "starred", "templateType", "tone", "topic", "updatedAt", "legacy-user" FROM "Content";
DROP TABLE "Content";
ALTER TABLE "new_Content" RENAME TO "Content";
CREATE INDEX "Content_userId_idx" ON "Content"("userId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("allDay", "color", "createdAt", "description", "endTime", "id", "startTime", "taskId", "title", "userId") SELECT "allDay", "color", "createdAt", "description", "endTime", "id", "startTime", "taskId", "title", "legacy-user" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_userId_idx" ON "Event"("userId");
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("color", "createdAt", "frequency", "icon", "id", "name", "streak", "userId") SELECT "color", "createdAt", "frequency", "icon", "id", "name", "streak", "legacy-user" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
CREATE TABLE "new_RoutineBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "activity" TEXT NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" TEXT,
    "planDate" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutineBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoutineBlock" ("activity", "completed", "completedAt", "createdAt", "dayOfWeek", "endTime", "id", "order", "planDate", "recurring", "startTime", "timeSlot", "title", "userId") SELECT "activity", "completed", "completedAt", "createdAt", "dayOfWeek", "endTime", "id", "order", "planDate", "recurring", "startTime", "timeSlot", "title", "legacy-user" FROM "RoutineBlock";
DROP TABLE "RoutineBlock";
ALTER TABLE "new_RoutineBlock" RENAME TO "RoutineBlock";
CREATE INDEX "RoutineBlock_userId_idx" ON "RoutineBlock"("userId");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "tags" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("category", "completed", "createdAt", "description", "dueDate", "id", "priority", "tags", "title", "updatedAt", "userId") SELECT "category", "completed", "createdAt", "description", "dueDate", "id", "priority", "tags", "title", "updatedAt", "legacy-user" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
