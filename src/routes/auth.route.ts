import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController()

router.post("/signin", authController.signin);
router.post("/signup", authController.signup);
router.get("/me", authController.handleProfile)

export default router;