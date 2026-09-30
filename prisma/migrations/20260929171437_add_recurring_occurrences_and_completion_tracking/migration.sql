/*
  Warnings:

  - The values [HOUSEHOLD_INVITATION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[recurrenceGroupId,scheduledDate]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taskId,userId]` on the table `TaskCompletion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TASK_ASSIGNED', 'TASK_DUE_SOON', 'TASK_COMPLETED', 'TASK_REASSIGNED', 'FEEDBACK_ACTIVITY', 'GENERAL');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurrenceGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Task_recurrenceGroupId_idx" ON "Task"("recurrenceGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_recurrenceGroupId_scheduledDate_key" ON "Task"("recurrenceGroupId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_taskId_userId_key" ON "TaskCompletion"("taskId", "userId");
