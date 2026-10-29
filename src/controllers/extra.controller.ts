import type { Response } from "express";
import prisma from "../db";
import type { AuthenticatedRequest } from "../types/authenticatedRequest.type";

async function handleOnRamp(req: AuthenticatedRequest, res: Response) {
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

            prisma.walletEvent.create({
                data: {
                    user_id: userId,
                    transaction_type: "onramp",
                    transaction_amount: amount
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

async function handleTransactions(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

    try {
        const transactions = await prisma.walletEvent.findMany({
            where: {
                user_id: userId
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

async function handleProfile(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

    try {

        const [user, transactions] = await prisma.$transaction([

            prisma.user.findFirst({
                where: {
                    id: userId
                },
                omit: {
                    password: true
                }
            }),

            prisma.walletEvent.findMany({
                where: {
                    user_id: userId
                }
            })
        ]);

        return res.status(200).json({success: true, data: {user, transactions}});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
    }
}

export {
    handleOnRamp,
    handleTransactions,
    handleProfile
}