import { Router } from "express";
import { getBets, makeBet } from "../controllers/bet.controller.js";

const router = Router();

router.get("/", getBets);
router.post("/", makeBet);


export default router;