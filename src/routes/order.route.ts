import { Router } from "express";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const orderController = new OrderController()

router.post("/", orderController.createOrder)
router.delete("/:id", orderController.cancelOrder)

export default router;