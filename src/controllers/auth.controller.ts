import type { Request, Response } from "express";
import prisma from "../db";
import bcrypt from "bcryptjs";
import { validate } from "../validations/validator";
import { authSchema } from "../validations/schemas/auth.schema";
import { signToken } from "../utils/helpers";

export class AuthController {
    async signin(req: Request, res: Response) {
        const result = validate(authSchema, req.body);

        if(!result.success) {
            return res.status(411).json({success: false, errors: result.errors});
        }

        const { username, password } = result.data;

        try {
            const user = await prisma.user.findUnique({
                where: {
                    username
                }
            });

            if(!user) {
                return res.status(400).json({message: "No user found"});
            }

            const finalResult = await bcrypt.compare(password, user.password);

            if(!finalResult) {
                return res.status(400).json({message: "Password doesn't match"});
            }

            return res.status(200).json({message: "Sign in successful", token: signToken(user.id)});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }

            return res.status(500).json({ message: "An unexpected error occurred" });
        }
    }

    async signup(req: Request, res: Response) {
        const result = validate(authSchema, req.body);

        if(!result.success) {
            return res.status(411).json({success: false, errors: result.errors});
        }

        const { username, password } = result.data;

        try {
            const user = await prisma.user.findUnique({
                where: {
                    username
                }
            });

            if(user) {
                return res.status(400).json({message: "This user already exists. Please sign in"});
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const finalResult = await prisma.user.create({
                data: {
                    username,
                    password: passwordHash
                },
                omit: {
                    password: true
                }
            });

            return res.status(201).json({success: true, message: "User created successfully", user: finalResult});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }
            console.error("An unexpected error occurred", error);
        }
    }

    async handleProfile(req: Request, res: Response) {

        const userId = req?.userId;

        if(!userId) {
            return res.status(401).json({message: "You need to be logged in to view the profile"})
        }

        try {

            const [user, transactions] = await prisma.$transaction([

                prisma.user.findFirst({
                    where: {
                        id: userId
                    },
                    omit: {
                        password: true
                    }
                }),

                prisma.eventLog.findMany({
                    where: {
                        userId: userId
                    }
                })
            ]);

            return res.status(200).json({success: true, data: {user, transactions}});

        } catch (error) {

            if(error instanceof Error) {
                return res.status(500).json({message: "Something went wrong", error: error.message});
            }

            console.error("An unexpected error occurred", error);
        }
    }
}