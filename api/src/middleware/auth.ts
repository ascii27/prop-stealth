import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { JwtPayload } from "../types.js";

// Augment Express.User (declared by @types/passport) so that req.user is
// typed as JwtPayload throughout the app when requireAuth is applied.
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[config.cookieName];

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
