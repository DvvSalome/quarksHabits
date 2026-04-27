-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoutineBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RoutineBlock" ("activity", "createdAt", "dayOfWeek", "endTime", "id", "order", "planDate", "recurring", "startTime", "timeSlot", "title") SELECT "activity", "createdAt", "dayOfWeek", "endTime", "id", "order", "planDate", "recurring", "startTime", "timeSlot", "title" FROM "RoutineBlock";
DROP TABLE "RoutineBlock";
ALTER TABLE "new_RoutineBlock" RENAME TO "RoutineBlock";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
