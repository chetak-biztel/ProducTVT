-- Links a weekly-plan row to the todo it was created from, so marking either one done syncs the other.
ALTER TABLE "PlanItem" ADD COLUMN "sourceTodoId" TEXT;

CREATE UNIQUE INDEX "PlanItem_sourceTodoId_key" ON "PlanItem"("sourceTodoId");

ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_sourceTodoId_fkey" FOREIGN KEY ("sourceTodoId") REFERENCES "Todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
