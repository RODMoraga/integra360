import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.sub;

  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Unauthorized"
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

  res.status(StatusCodes.OK).json(user);
}
