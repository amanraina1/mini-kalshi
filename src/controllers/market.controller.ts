import type { Request, Response } from "express";
import prisma from "../db";
import { validate } from "../validations/validator";
import { marketSchema } from "../validations/schemas/market.schema";

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
    */
}

async function mergePairs(req: Request, res: Response) {
    /*
        1. first get the marketId from the params and check if this market exists and its in pending state
        2. get the qty from the request body
        3. multiply the quantity with 100 to get the price
        4. check the stockBalance table, this user should have greater than or equal quantity for both yes and no shares
        5. also reduce the quantity of yes/no shares from this market 
        6. decrement the totalIssued by qty
        7. credit the user's usd balance (this will give the money required)
    */
}

export {
    createMarket,
    getAllMarkets,
    getMyMarkets,
    updateMarket
}