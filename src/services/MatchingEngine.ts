import { PrismaClient, OrderSide, ContractType, OrderStatus, FillKind, Prisma } from "@prisma/client";

export class MatchingEngine {

  private static instance: MatchingEngine;
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
  }

  public static getInstance(prismaClient?: PrismaClient): MatchingEngine {
    if (!MatchingEngine.instance) {
      if (!prismaClient) {
        throw new Error("PrismaClient is required for the initial setup of MatchingEngine.");
      }
      MatchingEngine.instance = new MatchingEngine(prismaClient);
    }
    return MatchingEngine.instance;
  }

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

  async resolveMarket(marketId: string, adminId: string, winningOutcome: "yes" | "no") {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Verify market exists and is still pending
      const market = await tx.market.findUnique({ where: { id: marketId } });
      if (!market) throw new Error("Market not found");
      if (market.resolution === "resolved") throw new Error("Market is already resolved");

      // 2. Optional: Verify admin role (assuming you pass user or check role)
      const admin = await tx.user.findUnique({ where: { id: adminId } });
      if (!admin || admin.role !== "admin") {
        throw new Error("Unauthorized: Only admins can resolve markets");
      }

      // 3. Update Market status to resolved and set outcome
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          resolution: "resolved",
          outcome: winningOutcome,
          resolvedAt: new Date(),
        },
      });

      // 4. Cancel all open or partial orders for this market so locked funds/shares are released
      const openOrders = await tx.order.findMany({
        where: { marketId, status: { in: ["open", "partial"] } },
      });

      for (const order of openOrders) {
        const unfilledQty = order.qty - order.filledQty;
        if (order.side === "buy") {
          await tx.user.update({
            where: { id: order.userId },
            data: { lockedBalance: { decrement: unfilledQty * order.price } },
          });
        } else {
          await tx.stockBalance.update({
            where: { marketId_userId: { marketId, userId: order.userId } },
            data: {
              lockedYesQty: order.contract === "yes" ? { decrement: unfilledQty } : undefined,
              lockedNoQty: order.contract === "no" ? { decrement: unfilledQty } : undefined,
            },
          });
        }
      }

      await tx.order.updateMany({
        where: { marketId, status: { in: ["open", "partial"] } },
        data: { status: "cancelled" },
      });

      // 5. Fetch all stock balances for this market to distribute payouts
      const stockBalances = await tx.stockBalance.findMany({
        where: { marketId },
      });

      // 6. Payout winning holders: 1 winning share = 100 cents (₹1)
      for (const sb of stockBalances) {
        const winningQty = winningOutcome === "yes" ? sb.yesQty : sb.noQty;
        
        if (winningQty > 0) {
          const payoutCents = winningQty * 100; // 100 cents per winning contract

          await tx.user.update({
            where: { id: sb.userId },
            data: { balance: { increment: payoutCents } },
          });

          // Record payout log in EventLog
          await tx.eventLog.create({
            data: {
              userId: sb.userId,
              marketId,
              qty: winningQty,
              cashDelta: payoutCents,
              type: "settled",
            },
          });
        }
      }

      return updatedMarket;
    }, {
      maxWait: 5000, // default max wait
      timeout: 10000
    });
  }
}