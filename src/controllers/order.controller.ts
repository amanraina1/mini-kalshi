import type { Request, Response } from "express";
import { MatchingEngine } from "../services/MatchingEngine";
import { validate } from "../validations/validator";
import { cancelOrderSchema, createOrderSchema } from "../validations/schemas/order.schema";

export class OrderController {

    private matchingEngine: MatchingEngine

    constructor () {
        this.matchingEngine = MatchingEngine.getInstance()
    }

    async createOrder(req: Request, res: Response) {

        const result = validate(createOrderSchema, {...req.body, userId: req.userId});

        if(!result.success) {
            return res.status(411).json({success: false, errors: result.errors});
        }

        try {

            const { userId, marketId, side, contract, price, qty } = result.data;

            const order = await this.matchingEngine.placeOrder({ userId, marketId, side, contract, price, qty });

            return res.status(201).json({ success: true, order });

        } catch (error: any) {

            return res.status(400).json({ success: false, error: error.message });
        }
    }

    async cancelOrder(req: Request, res: Response) {

        const result = validate(cancelOrderSchema, {id: req.params.id, userId: req.userId});

        if(!result.success) {
            return res.status(411).json({success: false, errors: result.errors});
        }

        try {

            const { userId, id } = result.data;

            const order = await this.matchingEngine.cancelOrder(id.toString(), userId);

            return res.status(200).json({ success: true, order });

        } catch (error: any) {

            return res.status(400).json({ success: false, error: error.message });
        }
    }
}