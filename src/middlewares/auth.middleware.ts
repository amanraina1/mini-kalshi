import type { NextFunction, Request, Response } from "express";
import { verify } from "../utils/helpers";

function verifyAuth(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token found or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    if(!token) {
        return res.status(401).json({ message: "No token found or invalid format" });
    }

    try {
        const payload = verify(token) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Unauthorized or expired token" });
    }

}

export {
    verifyAuth
}