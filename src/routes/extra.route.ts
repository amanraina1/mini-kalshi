import { Router } from "express";
import { handleOnRamp, handleTransactions, handleProfile } from "../controllers/extra.controller.js";

const router = Router();

router.post("/onramp", handleOnRamp);
router.get("/transactions", handleTransactions);
router.get("/profile", handleProfile);

export default router;