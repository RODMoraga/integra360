import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";

export function requireRoles(...allowedRoles: string[]) {
  const normalizedAllowedRoles = allowedRoles.map((role) => role.trim().toUpperCase());

  return (req: Request, _res: Response, next: NextFunction): void => {
    const currentRole = req.auth?.role?.trim().toUpperCase();

    if (!currentRole) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
    }

    if (!normalizedAllowedRoles.includes(currentRole)) {
      if (currentRole === "SUPERADMIN") {
        next();
        return;
      }

      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    next();
  };
}