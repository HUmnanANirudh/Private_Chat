import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
export const assign = (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.["x-auth-value"];

  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie("x-auth-value", token, {
      httpOnly: true,   
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  req.participantToken = token;

  next();
};
