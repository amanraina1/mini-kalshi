import type { NextFunction, Request, Response } from "express";
import { verify } from "../utils/helpers";

function veriyAuth(req: Request, res: Response, next: NextFunction) {
    if(!req.headers.token) {
        return res.status(400).json({message: "No token found in the headers"});
    }

    const token = req.headers.token as string;

    try {
        const payload = verify(token);
        req.userId = payload.userId;
        next();
    } catch (e) {
        res.status(400).json({message: "Unauthorized"})
    }
}

function verifyAdmin(req: Request, res: Response, next: NextFunction) {
    // if(!req.headers.adminToken) {
    //     return res.status(400).json({message: "This is an admin route"});
    // }
    // TODO :: add logic in this middleware

    next();
}

export {
    veriyAuth,
    verifyAdmin
}