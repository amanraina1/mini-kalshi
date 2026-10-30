-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('pending', 'resolved');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('yes', 'no');

-- CreateTable
CREATE TABLE "market" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "resolution" "Resolution" NOT NULL DEFAULT 'pending',
    "outcome" "Outcome",
    "total_issued" INTEGER NOT NULL DEFAULT 0,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "market" ADD CONSTRAINT "market_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
