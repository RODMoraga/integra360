import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

type TokenPayload = {
  sub: number;
  email: string;
  role: string;
  companyId?: number;
  authSource?: "legacy" | "tenant";
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: TokenPayload;
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof decoded !== "object" || decoded === null) {
      throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
    }

    if (!("sub" in decoded) || !("email" in decoded) || !("role" in decoded)) {
      throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
    }

    const payload: TokenPayload = {
      sub: Number(decoded.sub),
      email: String(decoded.email),
      role: String(decoded.role),
      companyId: "companyId" in decoded && decoded.companyId !== undefined ? Number(decoded.companyId) : undefined,
      authSource:
        "authSource" in decoded && (decoded.authSource === "legacy" || decoded.authSource === "tenant")
          ? decoded.authSource
          : undefined
    };
    req.auth = payload;
    next();
  } catch {
    throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
  }
}
