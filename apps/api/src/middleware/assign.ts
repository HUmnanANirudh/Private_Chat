import type { Request, Response, NextFunction } from "express";

export const assign = (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.["x-auth-value"].value;

    if (!token) {
        token =  crypto.randomUUID().slice(0, 32);
        res.cookie("x-auth-value", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    }

    req.participantToken = token;

    next();
}