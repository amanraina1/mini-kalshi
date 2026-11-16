import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";

const router = Router();
const walletController = new WalletController()

router.post("/deposit", walletController.handleDeposit);
router.post("/withdraw", walletController.handleWithdraw);
router.post("/history", walletController.handleTransactions)

export default router;