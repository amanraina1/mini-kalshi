import { Router } from "express";
import { createMarket, getAllMarkets, getMyMarkets } from "../controllers/market.controller.js";

const router = Router();

router.post("/", createMarket);
router.get("/", getAllMarkets);
router.get("/me", getMyMarkets);

export default router;