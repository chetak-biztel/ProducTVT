-- Speeds up "which projects is this user a member of" lookups.
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");
