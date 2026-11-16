import { Router } from "express";
import { createMarket, getAllMarkets, getMarketDetails, getMyMarkets, mergePairs, splitPairs, updateMarket } from "../controllers/market.controller";

const router = Router();

router.post("/", createMarket);
router.post("/:id/update", updateMarket);
router.get("/:id", getMarketDetails);
router.get("/:id/mint", splitPairs); // Split cash into Yes/No shares
router.get("/:id/burn", mergePairs); // Merge Yes/No shares back to cash
router.get("/", getAllMarkets);
router.get("/me", getMyMarkets);

export default router;