import { Router } from "express";
import { authGuard } from "../../../common/middleware/authGuard.js";
import { me } from "../controllers/user.controller.js";

export const userRoutes = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *       401:
 *         description: Unauthorized
 */
userRoutes.get("/me", authGuard, me);
