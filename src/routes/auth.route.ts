import { Router } from "express";
import { handleProfile, signin, signup } from "../controllers/auth.controller";

const router = Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/me", handleProfile)

export default router;