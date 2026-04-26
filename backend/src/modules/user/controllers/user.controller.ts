import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";

/**
 * GET /api/v1/users/me
 *
 * Returns the authenticated user's profile. The response shape differs
 * depending on the token's `authSource`:
 *
 * - **`"tenant"`** — Looks up the user in `biz_users`, resolves the role
 *   from the `user_roles` relation, and includes `companyId`.
 * - **`"legacy"` / undefined** — Looks up the user in the legacy `users`
 *   table and returns the stored `role` field directly.
 *
 * @param req - Express request with `req.auth` populated by `authGuard`.
 * @param res - Express response.
 */
export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.sub;
  const companyId = req.auth?.companyId;
  const authSource = req.auth?.authSource;

  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Unauthorized"
    });
    return;
  }

  if (authSource === "tenant" && companyId) {
    const user = await prisma.bizUser.findFirst({
      where: {
        id: BigInt(userId),
        companyId: BigInt(companyId),
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        companyId: true,
        userRoles: {
          where: {
            role: {
              deletedAt: null
            }
          },
          select: {
            role: {
              select: {
                code: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found"
      });
      return;
    }

    const roleCodes = user.userRoles.map((entry) => entry.role.code.trim().toUpperCase());
    const normalizedRole = roleCodes.includes("SUPERADMIN")
      ? "SUPERADMIN"
      : roleCodes.includes("ADMIN")
        ? "ADMIN"
        : roleCodes[0] ?? "USER";

    res.status(StatusCodes.OK).json({
      id: Number(user.id),
      companyId: Number(user.companyId),
      fullName: user.fullName,
      email: user.email,
      role: normalizedRole,
      createdAt: user.createdAt
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({
      message: "User not found"
    });
    return;
  }

  res.status(StatusCodes.OK).json(user);
}
