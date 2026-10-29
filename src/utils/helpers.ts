import jwt from "jsonwebtoken";

export function getSecret() {
    return process.env.JWT_SECRET || "123random";
}

export function signToken(userId: string) {
    return jwt.sign({userId}, getSecret());
}

export function verify(token: string) {
    return jwt.verify(token, getSecret());
}