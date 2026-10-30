import type { Request, Response } from "express";
import prisma from "../db";

async function getAllStockBalance(req: Request, res: Response) {

    const { userId } = req;

    try {
        const stockBalance = await prisma.stockBalance.findMany({
            where: {
                userId
            }
        });

        return res.status(200).json({success: true, balance: stockBalance})
    } catch(err) {

    }
}

async function getMarketStockBalance(req: Request, res: Response) {

    const { userId } = req;
    const { marketId } = req.body;

    try {
        const stockBalance = await prisma.stockBalance.findMany({
            where: {
                userId,
                marketId
            }
        });

        return res.status(200).json({success: true, balance: stockBalance})
    } catch(err) {

    }
}

export {
    getAllStockBalance,
    getMarketStockBalance
}