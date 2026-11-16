import { PrismaClient, OrderSide, ContractType, OrderStatus, FillKind, Prisma } from "@prisma/client";

export class MatchingEngine {
  constructor(private prisma: PrismaClient) {}

  async placeOrder(input: {
    userId: string;
    marketId: string;
    side: OrderSide;
    contract: ContractType;
    price: number;
    qty: number;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      const { userId, marketId, side, contract, price, qty } = input;

      // 1. Validate User & Stock Balance
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const stockBalance = await tx.stockBalance.findUnique({
        where: { marketId_userId: { marketId, userId } },
      });

      // 2. Pre-fund / Lock collateral
      if (side === OrderSide.buy) {
        const totalCost = price * qty;
        if (user.balance - user.lockedBalance < totalCost) {
          throw new Error("Insufficient available balance");
        }
        await tx.user.update({
          where: { id: userId },
          data: { lockedBalance: { increment: totalCost } },
        });
      } else {
        const available = contract === ContractType.yes 
          ? (stockBalance?.yesQty || 0) - (stockBalance?.lockedYesQty || 0)
          : (stockBalance?.noQty || 0) - (stockBalance?.lockedNoQty || 0);

        if (available < qty) throw new Error("Insufficient available shares");

        await tx.stockBalance.upsert({
          where: { marketId_userId: { marketId, userId } },
          create: {
            marketId,
            userId,
            lockedYesQty: contract === ContractType.yes ? qty : 0,
            lockedNoQty: contract === ContractType.no ? qty : 0,
          },
          update: {
            lockedYesQty: contract === ContractType.yes ? { increment: qty } : undefined,
            lockedNoQty: contract === ContractType.no ? { increment: qty } : undefined,
          },
        });
      }

      // 3. Create the order
      const newOrder = await tx.order.create({
        data: { marketId, userId, side, contract, price, qty, filledQty: 0, status: OrderStatus.open },
      });

      // 4. Run Matching Loop
      await this.matchOrders(tx, newOrder);

      return await tx.order.findUnique({ where: { id: newOrder.id } });
    });
  }

  private async matchOrders(tx: Prisma.TransactionClient, incomingOrder: any) {
    let remainingQty = incomingOrder.qty - incomingOrder.filledQty;
    const opposingSide = incomingOrder.side === OrderSide.buy ? OrderSide.sell : OrderSide.buy;

    const matchingOrders = await tx.order.findMany({
      where: {
        marketId: incomingOrder.marketId,
        contract: incomingOrder.contract,
        side: opposingSide,
        status: { in: [OrderStatus.open, OrderStatus.partial] },
        userId: { not: incomingOrder.userId },
        ...(incomingOrder.side === OrderSide.buy ? { price: { lte: incomingOrder.price } } : { price: { gte: incomingOrder.price } }),
      },
      orderBy: [
        { price: incomingOrder.side === OrderSide.buy ? "asc" : "desc" },
        { createdAt: "asc" },
      ],
    });

    for (const maker of matchingOrders) {
      if (remainingQty <= 0) break;

      const fillQty = Math.min(remainingQty, maker.qty - maker.filledQty);
      if (fillQty <= 0) continue;

      // Create Fill record
      await tx.fill.create({
        data: {
          makerOrderId: maker.id,
          takerOrderId: incomingOrder.id,
          kind: FillKind.transfer,
          price: maker.price,
          qty: fillQty,
        },
      });

      // Update Maker status
      const makerFinished = maker.filledQty + fillQty === maker.qty;
      await tx.order.update({
        where: { id: maker.id },
        data: {
          filledQty: { increment: fillQty },
          status: makerFinished ? OrderStatus.filled : OrderStatus.partial,
        },
      });

      remainingQty -= fillQty;
    }

    // Update Incoming Order final status
    const incomingFinished = remainingQty === 0;
    await tx.order.update({
      where: { id: incomingOrder.id },
      data: {
        filledQty: incomingOrder.qty - remainingQty,
        status: incomingFinished ? OrderStatus.filled : remainingQty < incomingOrder.qty ? OrderStatus.partial : OrderStatus.open,
      },
    });
  }

  async cancelOrder(orderId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");
      if (order.userId !== userId) throw new Error("Unauthorized");
      if (order.status === OrderStatus.filled || order.status === OrderStatus.cancelled) {
        throw new Error("Order cannot be cancelled");
      }

      const unfilledQty = order.qty - order.filledQty;

      // Unlock assets
      if (order.side === OrderSide.buy) {
        await tx.user.update({
          where: { id: order.userId },
          data: { lockedBalance: { decrement: unfilledQty * order.price } },
        });
      } else {
        await tx.stockBalance.update({
          where: { marketId_userId: { marketId: order.marketId, userId: order.userId } },
          data: {
            lockedYesQty: order.contract === ContractType.yes ? { decrement: unfilledQty } : undefined,
            lockedNoQty: order.contract === ContractType.no ? { decrement: unfilledQty } : undefined,
          },
        });
      }

      return await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled },
      });
    });
  }
}