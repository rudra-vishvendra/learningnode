import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types/auth.types.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "omnidesk_super_secret_key_2026";

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid Bearer token" });
    return;
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Malformed Bearer token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload &
      JwtPayload;
    req.user = {
      tenantId: decoded?.tenantId,
      email: decoded?.email,
      role: decoded?.role,
    };
    next();
  } catch (error) {
    console.error(`[Auth Guard] Invalid token attempt detected.`);
    res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};
