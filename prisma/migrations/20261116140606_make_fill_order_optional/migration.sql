-- DropForeignKey
ALTER TABLE "fill" DROP CONSTRAINT "fill_maker_order_id_fkey";

-- DropForeignKey
ALTER TABLE "fill" DROP CONSTRAINT "fill_taker_order_id_fkey";

-- AlterTable
ALTER TABLE "fill" ALTER COLUMN "maker_order_id" DROP NOT NULL,
ALTER COLUMN "taker_order_id" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "fill" ADD CONSTRAINT "fill_maker_order_id_fkey" FOREIGN KEY ("maker_order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill" ADD CONSTRAINT "fill_taker_order_id_fkey" FOREIGN KEY ("taker_order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
