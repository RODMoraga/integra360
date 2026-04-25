import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { loginSchema, registerSchema } from "../dto/auth.schema.js";
import { loginUser, registerUser } from "../services/auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  const payload = registerSchema.parse(req.body);
  const tokens = await registerUser(payload);
  res.status(StatusCodes.CREATED).json(tokens);
}

export async function login(req: Request, res: Response): Promise<void> {
  const payload = loginSchema.parse(req.body);
  const tokens = await loginUser(payload);
  res.status(StatusCodes.OK).json(tokens);
}
