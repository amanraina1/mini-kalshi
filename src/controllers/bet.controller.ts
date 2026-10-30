import type { Response } from "express";
import prisma from "../db";
import { createBetSchema } from "../validations/schemas/bet.schema";
import { validate } from "../validations/validator";
import type { AuthenticatedRequest } from "../types/request";

async function getBets(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

    try {
        const bets = await prisma.bet.findMany({
            where: {
                user_id: userId
            }
        });

        return res.status(201).json({success: true, bets});

    } catch (error) {
        if(error instanceof Error) {
            return res.status(500).json({success: false, message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

async function makeBet(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

    // validation
    const result = validate(createBetSchema, req.body);
    
    if(!result.success) {
        return res.status(400).json({success: false, errors: result.errors});
    }
    
    const { marketId, amount } = result.data;

    try {
        // before making a bet to this market, first check if this market exists or not and if its pending
        const market = await prisma.market.findFirst({
            where: {
                id: marketId,
                resolution: "pending"
            }
        });

        // if doesn't exist, then early return
        if(!market) {
            return res.status(400).json({success: false, message: "No market exists with this id"});
        }

        // now check if user has this much balance to place the bet or not
        const user = await prisma.user.findFirst({
            where: {
                id: userId
            }
        });

        if(user.balance < amount) {
            return res.status(400).json({success: false, message: "Insufficient funds"});
        }

        // now before making any new bet, first check, that the already added amount + this amount should not exceed the initialWager

        //already added amount
        const totalBets = await prisma.bet.aggregate({
            where: {
                market_id: market.id
            },
            _sum: {
                bet_amount: true
            }
        });

        const totalAmount = totalBets._sum.bet_amount + amount;

        if(totalAmount > market.initialWager) {
            return res.status(400).json({message: "Cannot place bet, the amount exceeds the total bet amount"});
        }

        const [bet] = prisma.$transaction([
            // create a bet
            prisma.bet.create({
                data: {
                    user_id: userId,
                    market_id: marketId,
                    bet_amount: amount
                }
            }),

            // deduct the amount from user's balance
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            }),

            // add a transaction
            prisma.walletEvent.create({
                data: {
                    user_id: userId,
                    transaction_type: "added_bet",
                    transaction_amount: amount
                }
            })
        ]);

        return res.status(201).json({success: true, betId: bet.id});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({success: false, message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

export {
    makeBet,
    getBets
}