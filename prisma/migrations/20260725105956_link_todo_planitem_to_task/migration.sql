-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "sourceTaskId" TEXT;

-- AlterTable
ALTER TABLE "PlanItem" ADD COLUMN     "sourceTaskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Todo_sourceTaskId_key" ON "Todo"("sourceTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanItem_sourceTaskId_key" ON "PlanItem"("sourceTaskId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
