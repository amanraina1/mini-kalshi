import type { Request, Response } from "express";
import prisma from "../db";
import { validate } from "../validations/validator";
import { maergePairsSchema, marketSchema, splitPairsSchema } from "../validations/schemas/market.schema";

async function createMarket(req: Request, res: Response) {
    const result = validate(marketSchema, req.body);
    
    if(!result.success) {
        return res.status(412).json({success: false, errors: result.errors});
    }

    const { title } = result.data;
    const { userId } = req;

    try {

        const finalResult = await prisma.market.create({
            data: {
                title,
                creatorId: userId
            }
        })

        return res.status(201).json({success: true, message: "Market created successfully", marketId: finalResult.id});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
        return;
    }
}

async function getAllMarkets(req: Request, res: Response) {

    try {
        const markets = await prisma.market.findMany();

        return res.status(201).json({success: true, markets});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
        return;
    }
}

async function getMyMarkets(req: Request, res: Response) {

    const { userId } = req;

    try {
        const markets = await prisma.market.findMany({
            where: {
                creatorId: userId
            }
        });

        return res.status(201).json({success: true, markets});

    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
        return;
    }
}

async function updateMarket(req: Request, res: Response) {

    const { id } = req.params;
    const { userId } = req;

    const result = validate(marketSchema, req.body);
    
    if(!result.success) {
        return res.status(400).json({success: false, errors: result.errors});
    }

    const { title } = result.data;

    try {
        const market = await prisma.market.update({
            where: {
                id: String(id)
            },
            data: {
                title
            }
        });

        return res.status(201).json({success: true, market});
    } catch (error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
        return;
    }
}

async function splitPairs(req: Request, res: Response) {
    /*
        1. first get the marketId from the params and check if this market exists and its in pending state
        2. get the qty from the request body
        3. now multiply the qty with 100 (this will give the money required)
        4. check user's available balance, if he has the balance, then go ahead otherwise return the error response
        5. deduct the money from user's balance
        6. increment the totalIssued by qty
        7. credit the user's stock balance for this market for yes and no tokens by the qty
        8. Add the entry in the event_logs table
    */

    const result = validate(splitPairsSchema, {marketId: req.params.marketId, qty: req.body.qty});

    if(!result.success) {
        return res.status(412).json({success: false, errors: result.errors});
    }

    // 1. first get the marketId from the params and check if this market exists and its in pending state
    const { marketId, qty } = result.data;
    const { userId } = req;

    try{

        const market = await prisma.market.findFirst({
            where: {
                id: marketId,
                resolution: "pending"
            }
        });

        if(!market) {
            return res.status(400).json({success: false, message: "Either market doesn't exist or its resolved already"})
        }

        // 2. get the qty from the request body
        // 3. now multiply the qty with 100 (this will give the money required)
        const amountRequired = qty * 100;

        // 4. check user's available balance, if he has the balance, then go ahead otherwise return the error response
        const user = await prisma.user.findFirst({
            where: {
                id: userId
            }
        });

        if(!user) {
            return res.status(400).json({success: false, message: "No user found with this id"});
        }

        const userBalance = user.balance - user.lockedBalance;

        if(userBalance < amountRequired) {
            return res.status(400).json({success: false, message: "Insufficient funds"});
        }

        await prisma.$transaction([

            // 5. deduct the money from user's balance
            prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    balance: {
                        decrement: amountRequired
                    }
                }
            }),

            // 6. increment the totalIssued by qty
            prisma.market.update({
                where: {
                    id: marketId
                },
                data: {
                    totalIssued: {
                        increment: qty
                    }
                }
            }),

            // 7. credit the user's stock balance for this market for yes and no tokens by the qty
            prisma.stockBalance.upsert({
                where: {
                    marketId_userId: {marketId, userId}
                },
                create: {
                    marketId, 
                    userId, 
                    yesQty: qty, 
                    noQty: qty
                },
                update: {
                    yesQty: {
                        increment: qty
                    },
                    noQty: {
                        increment: qty
                    }
                }
            }),

            // 8. Add the entry in the event_logs table
            // TODO ::
        ]);

        return res.status(200).json({success: true, message: "Split happened successfully"})

    } catch(error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        console.error("An unexpected error occurred", error);
        return;
    }
}

async function mergePairs(req: Request, res: Response) {
    /*
        1. first get the marketId from the params and check if this market exists and its in pending state
        2. get the qty from the request body
        3. multiply the quantity with 100 to get the price
        4. check the stockBalance table, this user should have greater than or equal quantity for both yes and no shares
        5. reduce the quantity of yes/no shares from this market 
        6. decrement the totalIssued by qty
        7. credit the user's usd balance (this will give the money required)
    */

    const result = validate(maergePairsSchema, {marketId: req.params.marketId, qty: req.body.qty});

    if(!result.success) {
        return res.status(412).json({success: false, errors: result.errors});
    }

    // 1. first get the marketId from the params and check if this market exists and its in pending state
    const { marketId, qty } = result.data;
    const { userId } = req;

    try{

        const market = await prisma.market.findFirst({
            where: {
                id: marketId,
                resolution: "pending"
            }
        });

        if(!market) {
            return res.status(400).json({success: false, message: "Either market doesn't exist or its resolved already"})
        }

        // 2. get the qty from the request body
        // 3. multiply the quantity with 100 to get the price
        const amountRequired = qty * 100;

        // 4. check the stockBalance table, this user should have greater than or equal quantity for both yes and no shares
        const stockBal = await prisma.stockBalance.findFirst({
            where: {
                userId, marketId
            }
        });

        if(!stockBal) {
            return res.status(400).json({success: false, message: "No available quantity for merge pairs"});
        }

        const userStockYesBalance = stockBal.yesQty - stockBal.lockedYesQty;
        const userStockNoBalance = stockBal.noQty - stockBal.lockedNoQty;

        if(userStockYesBalance < qty || userStockNoBalance < qty) {
            return res.status(400).json({success: false, message: "Insufficient quantity"});
        }

        await prisma.$transaction([

            // 5. reduce the quantity of yes/no shares from this market
            prisma.stockBalance.update({
                where: {
                    marketId_userId: {marketId, userId}
                },
                data: {
                    yesQty: {
                        decrement: qty
                    },
                    noQty: {
                        decrement: qty
                    }
                }
            }),

            // 6. decrement the totalIssued by qty
            prisma.market.update({
                where: {
                    id: marketId
                },
                data: {
                    totalIssued: {
                        decrement: qty
                    }
                }
            }),

            // 7. credit the user's usd balance (this will give the money required)
            prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    balance: {
                        increment: amountRequired
                    }
                }
            }),
            
            // 8. Add the entry in the event_logs table
            // TODO ::
        ]);

        return res.status(200).json({success: true, message: "Merge happened successfully"})

    } catch(error) {

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }

        // TODO :: 
        console.error("An unexpected error occurred", error);
        return;
    }
}

export {
    createMarket,
    getAllMarkets,
    getMyMarkets,
    updateMarket
}