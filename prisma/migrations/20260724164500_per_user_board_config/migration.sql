-- Move Category and PlanStatus from shared/global to per-user ownership.
-- Existing rows are assigned to the earliest-created user (preserving any
-- PlanItem foreign keys), then cloned so every other existing user gets
-- their own independent, editable copy of the same starting set.

-- 1. Add ownerId as nullable first.
ALTER TABLE "Category" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "PlanStatus" ADD COLUMN "ownerId" TEXT;

-- 2. Drop the old global unique index on name — it would block cloning
--    same-named rows for other owners below.
DROP INDEX IF EXISTS "Category_name_key";
DROP INDEX IF EXISTS "PlanStatus_name_key";

-- 3. Backfill existing rows onto the earliest-created user.
UPDATE "Category" SET "ownerId" = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "ownerId" IS NULL;
UPDATE "PlanStatus" SET "ownerId" = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "ownerId" IS NULL;

-- 4. Clone the same starting set for every other existing user.
INSERT INTO "Category" (id, "ownerId", name, color, "order", active)
SELECT gen_random_uuid()::text, u.id, c.name, c.color, c."order", c.active
FROM "User" u
CROSS JOIN "Category" c
WHERE u.id <> c."ownerId";

INSERT INTO "PlanStatus" (id, "ownerId", name, color, "order", "isDefault")
SELECT gen_random_uuid()::text, u.id, s.name, s.color, s."order", s."isDefault"
FROM "User" u
CROSS JOIN "PlanStatus" s
WHERE u.id <> s."ownerId";

-- 5. Enforce NOT NULL now that every row has an owner.
ALTER TABLE "Category" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "PlanStatus" ALTER COLUMN "ownerId" SET NOT NULL;

-- 6. New per-owner unique index.
CREATE UNIQUE INDEX "Category_ownerId_name_key" ON "Category"("ownerId", "name");
CREATE UNIQUE INDEX "PlanStatus_ownerId_name_key" ON "PlanStatus"("ownerId", "name");

-- 7. Foreign keys.
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanStatus" ADD CONSTRAINT "PlanStatus_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
