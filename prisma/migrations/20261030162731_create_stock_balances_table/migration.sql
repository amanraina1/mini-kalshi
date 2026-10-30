-- CreateTable
CREATE TABLE "stock_balance" (
    "id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "yes_qty" INTEGER NOT NULL DEFAULT 0,
    "no_qty" INTEGER NOT NULL DEFAULT 0,
    "locked_yes_qty" INTEGER NOT NULL DEFAULT 0,
    "locked_no_qty" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_balance_user_id_idx" ON "stock_balance"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balance_market_id_user_id_key" ON "stock_balance"("market_id", "user_id");

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
