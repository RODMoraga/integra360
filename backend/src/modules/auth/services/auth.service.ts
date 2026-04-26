import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/errors/AppError.js";
import type { LoginInput, RegisterInput } from "../dto/auth.schema.js";

type AuthTokenPayload = {
  sub: number;
  email: string;
  role: string;
  companyId?: number;
  authSource: "legacy" | "tenant";
};

function issueAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

function issueRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

function isLegacyUserTableMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2021"
  );
}

async function resolveTenantRole(userId: bigint): Promise<string> {
  const roleRows = await prisma.role.findMany({
    where: {
      deletedAt: null,
      userRoles: {
        some: {
          userId
        }
      }
    },
    select: {
      code: true
    },
    orderBy: {
      id: "asc"
    }
  });

  const roleCodes = roleRows.map((role) => role.code.trim().toUpperCase());

  if (roleCodes.includes("SUPERADMIN")) {
    return "SUPERADMIN";
  }

  if (roleCodes.includes("ADMIN")) {
    return "ADMIN";
  }

  return roleCodes[0] ?? "USER";
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
  let user = null;

  try {
    user = await prisma.user.findUnique({
      where: { email: input.email }
    });
  } catch (error) {
    if (!isLegacyUserTableMissing(error)) {
      throw error;
    }
  }

  if (user) {
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!validPassword) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      authSource: "legacy"
    };

    return {
      accessToken: issueAccessToken(payload),
      refreshToken: issueRefreshToken(payload)
    };
  }

  const tenantUser = await prisma.bizUser.findFirst({
    where: {
      email: input.email,
      isActive: true,
      deletedAt: null,
      company: {
        isActive: true,
        deletedAt: null
      }
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      companyId: true
    },
    orderBy: {
      id: "asc"
    }
  });

  if (!tenantUser) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const validTenantPassword = await bcrypt.compare(input.password, tenantUser.passwordHash);

  if (!validTenantPassword) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const payload: AuthTokenPayload = {
    sub: Number(tenantUser.id),
    email: tenantUser.email,
    role: await resolveTenantRole(tenantUser.id),
    companyId: Number(tenantUser.companyId),
    authSource: "tenant"
  };

  return {
    accessToken: issueAccessToken(payload),
    refreshToken: issueRefreshToken(payload)
  };
}
