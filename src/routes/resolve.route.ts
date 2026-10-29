import { Router } from "express";
import { resolve } from "../controllers/resolve.controller.js";

const router = Router();

router.post("/", resolve);

export default router;