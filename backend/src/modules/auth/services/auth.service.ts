import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/errors/AppError.js";
import type { LoginInput, RegisterInput } from "../dto/auth.schema.js";

function issueAccessToken(payload: { sub: number; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

function issueRefreshToken(payload: { sub: number; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export async function registerUser(input: RegisterInput): Promise<{ accessToken: string; refreshToken: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existing) {
    throw new AppError("Email already in use", StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: "USER"
    }
  });

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: issueAccessToken(payload),
    refreshToken: issueRefreshToken(payload)
  };
}

export async function loginUser(input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: issueAccessToken(payload),
    refreshToken: issueRefreshToken(payload)
  };
}
