import type { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    tenantId: string;
    email: string;
    role: string;
  };
}

export interface TokenPayload {
  tenantId: string;
  userId: string;
  role: string;
}
