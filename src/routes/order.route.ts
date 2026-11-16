import { Router } from "express";
import { createOrder, getOrderBook, cancelOrder } from "../controllers/order.controller";

const router = Router()

router.post("/", createOrder)
router.get("/:id/orderbook", getOrderBook)
router.delete("/:id", cancelOrder)

export default router;