-- CreateEnum
CREATE TYPE "EventLogType" AS ENUM ('on_ramp', 'withdraw', 'split', 'merge', 'buy', 'sell', 'settled');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('yes', 'no');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('open', 'cancelled', 'filled', 'partial');

-- CreateEnum
CREATE TYPE "FillKind" AS ENUM ('transfer', 'mint', 'burn');

-- CreateTable
CREATE TABLE "event_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_id" TEXT,
    "fill_id" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "cash_delta" INTEGER NOT NULL DEFAULT 0,
    "yes_delta" INTEGER NOT NULL DEFAULT 0,
    "no_delta" INTEGER NOT NULL DEFAULT 0,
    "type" "EventLogType" NOT NULL,
    "price" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "contract" "ContractType" NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "filled_qty" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill" (
    "id" TEXT NOT NULL,
    "maker_order_id" TEXT NOT NULL,
    "taker_order_id" TEXT NOT NULL,
    "kind" "FillKind" NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_log_fill_id_user_id_key" ON "event_log"("fill_id", "user_id");

-- AddForeignKey
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_fill_id_fkey" FOREIGN KEY ("fill_id") REFERENCES "fill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill" ADD CONSTRAINT "fill_maker_order_id_fkey" FOREIGN KEY ("maker_order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill" ADD CONSTRAINT "fill_taker_order_id_fkey" FOREIGN KEY ("taker_order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
