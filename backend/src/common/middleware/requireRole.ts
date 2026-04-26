import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";

/**
 * Factory that returns an Express middleware enforcing role-based access
 * control (RBAC) on the authenticated user.
 *
 * The middleware reads `req.auth.role` (populated by `authGuard`) and
 * verifies it is included in the allowed roles list. `SUPERADMIN` always
 * bypasses the role check regardless of the allowed list.
 *
 * @param allowedRoles - One or more role codes that are permitted to access
 *   the route. Role comparison is case-insensitive.
 * @returns Express middleware that calls `next()` on success or throws an
 *   `AppError` with status **401** (no role) or **403** (insufficient role).
 *
 * @example
 * router.delete("/resource", authGuard, requireRoles("ADMIN"), asyncHandler(handler));
 */
export function requireRoles(...allowedRoles: string[]) {
  // Normalise once at middleware creation time, not on every request.
  const normalizedAllowedRoles = allowedRoles.map((role) => role.trim().toUpperCase());

  return (req: Request, _res: Response, next: NextFunction): void => {
    const currentRole = req.auth?.role?.trim().toUpperCase();

    if (!currentRole) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
    }

    if (!normalizedAllowedRoles.includes(currentRole)) {
      // SUPERADMIN has implicit access to every route.
      if (currentRole === "SUPERADMIN") {
        next();
        return;
      }

      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    next();
  };
}