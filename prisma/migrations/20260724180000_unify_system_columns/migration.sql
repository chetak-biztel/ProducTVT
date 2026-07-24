-- Lets Title/Category/Status share the same reorder/rename/hide UI as
-- user-defined columns, by giving each existing user a "system" PlanColumn
-- row for each. Purely additive: new enum + two new nullable/defaulted
-- columns, plus new rows — no existing data is touched.

CREATE TYPE "SystemField" AS ENUM ('TITLE', 'CATEGORY', 'STATUS');

ALTER TABLE "PlanColumn" ADD COLUMN "systemField" "SystemField";
ALTER TABLE "PlanColumn" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- Seed the three system columns for every existing user, ordered ahead of
-- whatever custom columns they may already have.
INSERT INTO "PlanColumn" (id, "ownerId", name, type, "order", "systemField")
SELECT gen_random_uuid()::text, u.id, 'Title', 'TEXT', -3, 'TITLE'
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "PlanColumn" pc WHERE pc."ownerId" = u.id AND pc."systemField" = 'TITLE'
);

INSERT INTO "PlanColumn" (id, "ownerId", name, type, "order", "systemField")
SELECT gen_random_uuid()::text, u.id, 'Category', 'SELECT', -2, 'CATEGORY'
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "PlanColumn" pc WHERE pc."ownerId" = u.id AND pc."systemField" = 'CATEGORY'
);

INSERT INTO "PlanColumn" (id, "ownerId", name, type, "order", "systemField")
SELECT gen_random_uuid()::text, u.id, 'Status', 'SELECT', -1, 'STATUS'
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "PlanColumn" pc WHERE pc."ownerId" = u.id AND pc."systemField" = 'STATUS'
);
