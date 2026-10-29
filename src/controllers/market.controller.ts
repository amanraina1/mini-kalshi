import type { Response } from "express";
import prisma from "../db";
import { validate } from "../validations/validator";
import { createMarketSchema } from "../validations/schemas/market.schema";
import type { AuthenticatedRequest } from "../types/authenticatedRequest.type";

async function createMarket(req: AuthenticatedRequest, res: Response) {
    const result = validate(createMarketSchema, req.body);
    
    if(!result.success) {
        return res.status(400).json({success: false, errors: result.errors});
    }

    const { title, initialWager, bet } = result.data;
    const { userId } = req;

    try {
        // before creating the market, first check if  user's wallet has atleast the amount required for initial wager
        const user = await prisma.user.find({
            where: {
                id: userId
            }
        });

        if(user.balance < initialWager) {
            return res.status(400).json({message: "Insufficient balance"})
        }

        // when the market is created, add the initial wager as a transaction in the wallet
        const [finalResult] = await prisma.$transaction([
            prisma.market.create({
                data: {
                    title,
                    initialWager,
                    creator_id: userId,
                    bet
                }
            }),

            prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    balance: {
                        decrement: initialWager
                    }
                }
            }),

            prisma.walletEvent.create({
                data: {
                    user_id: userId,
                    transaction_type: "create_market",
                    transaction_amount: initialWager
                }
            }),
        ]);

        return res.status(201).json({success: true, message: "Market created successfully", marketId: finalResult.id});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

async function getAllMarkets(req: AuthenticatedRequest, res: Response) {

    try {
        const markets = await prisma.market.findMany();

        return res.status(201).json({success: true, markets});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

async function getMyMarkets(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

    try {
        const markets = await prisma.market.findMany({
            where: {
                creator_id: userId
            }
        });

        return res.status(201).json({success: true, markets});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

export {
    createMarket,
    getAllMarkets,
    getMyMarkets
}