import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { loginSchema, registerSchema } from "../dto/auth.schema.js";
import { loginUser, registerUser } from "../services/auth.service.js";

/**
 * POST /api/v1/auth/register
 *
 * Validates the request body, delegates to {@link registerUser}, and
 * responds with **201 Created** plus the access/refresh token pair.
 *
 * @param req - Express request; `req.body` is validated against `registerSchema`.
 * @param res - Express response.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const payload = registerSchema.parse(req.body);
  const tokens = await registerUser(payload);
  res.status(StatusCodes.CREATED).json(tokens);
}

/**
 * POST /api/v1/auth/login
 *
 * Validates the request body, delegates to {@link loginUser}, and
 * responds with **200 OK** plus the access/refresh token pair.
 *
 * @param req - Express request; `req.body` is validated against `loginSchema`.
 * @param res - Express response.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const payload = loginSchema.parse(req.body);
  const tokens = await loginUser(payload);
  res.status(StatusCodes.OK).json(tokens);
}
