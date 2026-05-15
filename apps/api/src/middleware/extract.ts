import type { Request, Response,NextFunction } from "express";

export const extract = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.["x-auth-value"].value;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: No token provided"
        });
    }

    req.participantToken = token;

    next();
}