-- Adds a per-user custom-column system for the weekly plan table.
-- Purely additive (four brand-new tables) — no existing data is touched.

CREATE TYPE "PlanColumnType" AS ENUM ('TEXT', 'DATE', 'NUMBER', 'SELECT', 'MULTI_SELECT');

CREATE TABLE "PlanColumn" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlanColumnType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanColumn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanColumn_ownerId_name_key" ON "PlanColumn"("ownerId", "name");

ALTER TABLE "PlanColumn" ADD CONSTRAINT "PlanColumn_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlanColumnOption" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanColumnOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanColumnOption_columnId_name_key" ON "PlanColumnOption"("columnId", "name");

ALTER TABLE "PlanColumnOption" ADD CONSTRAINT "PlanColumnOption_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "PlanColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlanItemValue" (
    "id" TEXT NOT NULL,
    "planItemId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "textValue" TEXT,
    "dateValue" DATE,
    "numberValue" DOUBLE PRECISION,
    CONSTRAINT "PlanItemValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanItemValue_planItemId_columnId_key" ON "PlanItemValue"("planItemId", "columnId");

ALTER TABLE "PlanItemValue" ADD CONSTRAINT "PlanItemValue_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanItemValue" ADD CONSTRAINT "PlanItemValue_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "PlanColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlanItemValueOption" (
    "valueId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    CONSTRAINT "PlanItemValueOption_pkey" PRIMARY KEY ("valueId", "optionId")
);

ALTER TABLE "PlanItemValueOption" ADD CONSTRAINT "PlanItemValueOption_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "PlanItemValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanItemValueOption" ADD CONSTRAINT "PlanItemValueOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PlanColumnOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
