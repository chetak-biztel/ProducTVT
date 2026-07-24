-- Gives every existing user a "Tag" system column too, so it shares the same
-- reorder/rename/hide UI as Title/Category/Status. Placed after their current
-- highest-ordered column by default; fully draggable afterward.
INSERT INTO "PlanColumn" (id, "ownerId", name, type, "order", "systemField")
SELECT gen_random_uuid()::text, u.id, 'Tag', 'TEXT',
       COALESCE((SELECT MAX(pc."order") + 1 FROM "PlanColumn" pc WHERE pc."ownerId" = u.id), 0),
       'TAG'
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "PlanColumn" pc WHERE pc."ownerId" = u.id AND pc."systemField" = 'TAG'
);
