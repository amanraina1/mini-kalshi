import { Router } from "express";
import { signin, signup } from "../controllers/auth.controller";

const router = Router();

router.post("/signin", signin);
router.post("/signup", signup);

export default router;