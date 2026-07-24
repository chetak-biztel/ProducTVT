-- Allows deleting a user without being blocked by projects/tasks/updates they
-- created: these "created by" references become nullable and SET NULL on
-- delete, instead of RESTRICT. No existing data is affected (all current rows
-- already have a value here).

ALTER TABLE "Project" DROP CONSTRAINT "Project_createdById_fkey";
ALTER TABLE "Project" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectUpdate" DROP CONSTRAINT "ProjectUpdate_authorId_fkey";
ALTER TABLE "ProjectUpdate" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_createdById_fkey";
ALTER TABLE "ProjectTask" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
