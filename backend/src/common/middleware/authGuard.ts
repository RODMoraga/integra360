import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

/** Decoded JWT payload attached to every authenticated request. */
type TokenPayload = {
  /** User ID (subject claim). */
  sub: number;
  /** User email address. */
  email: string;
  /** User role code (e.g. `"ADMIN"`, `"SUPERADMIN"`). */
  role: string;
  /** ID of the tenant company; present only for tenant-sourced tokens. */
  companyId?: number;
  /** Identifies whether the token was issued for a legacy or tenant user. */
  authSource?: "legacy" | "tenant";
};

// Augment Express's Request interface so that `req.auth` is available
// throughout the application without additional casting.
declare module "express-serve-static-core" {
  interface Request {
    /** Decoded JWT payload set by `authGuard`. `undefined` when unauthenticated. */
    auth?: TokenPayload;
  }
}

/**
 * Express middleware that validates a Bearer JWT from the `Authorization`
 * header and attaches the decoded payload to `req.auth`.
 *
 * Throws an `AppError` with status **401** when:
 * - The `Authorization` header is missing or does not start with `"Bearer "`.
 * - The token cannot be verified against `JWT_ACCESS_SECRET`.
 * - The token payload is missing required claims (`sub`, `email`, `role`).
 *
 * @param req  - Express request object.
 * @param _res - Express response object (unused).
 * @param next - Next middleware function.
 */
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
