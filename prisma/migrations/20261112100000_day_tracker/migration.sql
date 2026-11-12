-- AlterTable
ALTER TABLE "User" ADD COLUMN "dayToken" TEXT;

-- CreateTable
CREATE TABLE "DayState" (
    "userId" TEXT NOT NULL,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayState_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_dayToken_key" ON "User"("dayToken");

-- AddForeignKey
ALTER TABLE "DayState" ADD CONSTRAINT "DayState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
