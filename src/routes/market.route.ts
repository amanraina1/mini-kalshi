import { Router } from "express";
import { createMarket, getAllMarkets, getMyMarkets, updateMarket } from "../controllers/market.controller";

const router = Router();

router.post("/", createMarket);
router.post("/:id/update", updateMarket);
router.get("/", getAllMarkets);
router.get("/me", getMyMarkets);

export default router;