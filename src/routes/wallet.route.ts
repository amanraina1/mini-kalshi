import { Router } from "express";
import { handleDeposit, handleTransactions, handleWithdraw } from "../controllers/wallet.controller";

const router = Router();

router.post("/deposit", handleDeposit);
router.post("/withdraw", handleWithdraw);
router.post("/history", handleTransactions)

export default router;