import prisma from "../db";
import bcrypt from "bcryptjs";
import { validate } from "../validations/validator";
import { authSchema } from "../validations/schemas/auth.schema";
import { signToken } from "../utils/helpers";
import type { Request, Response } from "express";

async function signin(req: Request, res: Response) {
    const result = validate(authSchema, req.body);
    console.log(result)

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

        console.error("An unexpected error occurred", error);
    }
}

async function signup(req: Request, res: Response) {
    const result = validate(authSchema, req.body);

    if(!result.success) {
        return res.status(411).json({success: false, errors: result.errors});
    }

    const { username, password } = result.data;

    try {
        const user = await prisma.user.findFirst({
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
        console.log("errorrrr => ", error);

        if(error instanceof Error) {
            return res.status(500).json({message: "Something went wrong", error: error.message});
        }
        console.error("An unexpected error occurred", error);
    }
}

export {
    signin,
    signup
}



// Read about liteLLM attack
// What are all different places where we can put "Caching" as an application