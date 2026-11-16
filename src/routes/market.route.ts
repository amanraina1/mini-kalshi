import { Router } from "express";
import { MarketController } from "../controllers/market.controller";

const router = Router();

const marketController = new MarketController()

router.post("/", marketController.createMarket);
router.post("/:id/update", marketController.updateMarket);
router.get("/:id", marketController.getMarketDetails);
router.get("/:id/mint", marketController.splitPairs); // Split cash into Yes/No shares
router.get("/:id/burn", marketController.mergePairs); // Merge Yes/No shares back to cash
router.get("/", marketController.getAllMarkets);
router.get("/me", marketController.getMyMarkets);
router.post("/:id/resolve", marketController.resolveMarket)

export default router;