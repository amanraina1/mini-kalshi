import { Router } from "express";
import { MarketController } from "../controllers/order.controller";
import { MatchingEngine } from "../services/MatchingEngine";
import prisma from "../db";

const router = Router();
const engineService = new MatchingEngine(prisma)
const marketController = new MarketController(engineService)

router.post("/", marketController.createOrder)
router.delete("/:id", marketController.cancelOrder)

export default router;