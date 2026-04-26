import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/errors/AppError.js";
import type { LoginInput, RegisterInput } from "../dto/auth.schema.js";

/** JWT payload structure used when signing both access and refresh tokens. */
type AuthTokenPayload = {
  /** User ID (subject claim). */
  sub: number;
  /** User email address. */
  email: string;
  /** Resolved role code for the user. */
  role: string;
  /** Tenant company ID; present only for multi-tenant users. */
  companyId?: number;
  /** Indicates whether the user was authenticated via the legacy or tenant table. */
  authSource: "legacy" | "tenant";
};

/**
 * Signs and returns a short-lived JWT access token.
 *
 * @param payload - Claims to embed in the token.
 * @returns Signed JWT string.
 */
function issueAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

/**
 * Signs and returns a long-lived JWT refresh token.
 *
 * @param payload - Claims to embed in the token.
 * @returns Signed JWT string.
 */
function issueRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

/**
 * Detects a Prisma error caused by the legacy `users` table not existing.
 * This allows the login flow to fall through to the tenant user lookup
 * without treating the missing table as a fatal error.
 *
 * @param error - Unknown error thrown by a Prisma query.
 * @returns `true` if the error is a Prisma P2021 (table not found).
 */
function isLegacyUserTableMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2021"
  );
}

/**
 * Resolves the effective role code for a tenant user by querying the
 * `user_roles` relation. Priority order: `SUPERADMIN` > `ADMIN` > first
 * role found > `"USER"`.
 *
 * @param userId - The `bizUser.id` (BigInt) of the tenant user.
 * @returns The resolved role code string.
 */
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

/**
 * Registers a new legacy user in the `users` table, hashes the password
 * with bcrypt (cost 12), and returns a fresh access/refresh token pair.
 *
 * @param input - Validated registration data (`fullName`, `email`, `password`).
 * @returns Object containing `accessToken` and `refreshToken` JWTs.
 * @throws {AppError} 409 Conflict if the email is already in use.
 */
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

/**
 * Authenticates a user against the legacy `users` table first, then
 * falls back to the multi-tenant `biz_users` table if the legacy table
 * is absent or the email is not found there.
 *
 * @param input - Validated login data (`email`, `password`).
 * @returns Object containing `accessToken` and `refreshToken` JWTs.
 * @throws {AppError} 401 Unauthorized if credentials are invalid.
 */
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
