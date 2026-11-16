import type { Request, Response } from "express";
import prisma from "../db";

// async function getAllStockBalance(req: Request, res: Response) {

//     const { userId } = req;

//     try {
//         const stockBalance = await prisma.stockBalance.findMany({
//             where: {
//                 userId
//             }
//         });

//         return res.status(200).json({success: true, balance: stockBalance})
//     } catch(err) {

//     }
// }

// async function getMarketStockBalance(req: Request, res: Response) {

//     const { userId } = req;
//     const { marketId } = req.body;

//     try {
//         const stockBalance = await prisma.stockBalance.findMany({
//             where: {
//                 userId,
//                 marketId
//             }
//         });

//         return res.status(200).json({success: true, balance: stockBalance})
//     } catch(err) {

//     }
// }

export class WalletController {
    async handleDeposit(req: Request, res: Response) {
        const { userId } = req;

        const { amount } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: userId
                }
            })

            if(!user) {
                return res.status(400).json({message: "No user found with this id"})
            }

            const balance = user.balance + amount;

            // update the balance and add the entry in the transactions table
            await prisma.$transaction([

                prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        balance
                    }
                }),

                prisma.eventLog.create({
                    data: {
                        userId: userId,
                        type: "on_ramp",
                        price: amount
                    }
                })
            ]);

            return res.status(200).json({success: false, message: "Balance updated successfully"});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }

            console.error("An unexpected error occurred", error);
        }
    }

    async handleWithdraw(req: Request, res: Response) {
        const { userId } = req;

        const { amount } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: userId
                }
            })

            if(!user) {
                return res.status(400).json({message: "No user found with this id"})
            }

            let balance = 0
            if(user.balance - user.lockedBalance >= amount) {
                balance = user.balance - amount;
            } else {
                return res.status(400).json({message: "Insufficient funds"})
            }

            // update the balance and add the entry in the transactions table
            await prisma.$transaction([

                prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        balance
                    }
                }),

                prisma.eventLog.create({
                    data: {
                        userId: userId,
                        type: "withdraw",
                        price: amount
                    }
                })
            ]);

            return res.status(200).json({success: false, message: "Balance updated successfully"});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }

            console.error("An unexpected error occurred", error);
        }
    }

    async handleTransactions(req: Request, res: Response) {

        const { userId } = req;

        try {
            const transactions = await prisma.eventLog.findMany({
                where: {
                    userId: userId
                }
            });

            return res.status(200).json({success: true, transactions});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }

            console.error("An unexpected error occurred", error);
        }
    }
}