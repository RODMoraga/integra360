import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";
import { logger } from "./common/logger/logger.js";
import { apiRateLimiter } from "./common/middleware/rateLimiter.js";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { authRoutes } from "./modules/auth/routes/auth.routes.js";
import { productRoutes } from "./modules/product/routes/product.routes.js";
import { productImageRoutes } from "./modules/product-image/routes/productImage.routes.js";
import { userRoutes } from "./modules/user/routes/user.routes.js";

/**
 * Central Express application instance.
 *
 * Global middleware stack (in order):
 * 1. `pino-http`  — Structured HTTP request logging.
 * 2. `morgan`     — Dev-mode request summary log.
 * 3. `helmet`     — Security-focused HTTP headers.
 * 4. `cors`       — CORS policy from `CORS_ORIGIN` env variable.
 * 5. `express.json` — JSON body parsing (max 1 MB).
 * 6. `apiRateLimiter` — Per-IP rate limiting.
 * 7. Static files served from `uploads/` for local asset access.
 * 8. Swagger UI (conditional on `SWAGGER_ENABLED`).
 *
 * Route prefixes:
 * - `/api/v1/auth`     — Authentication (register, login).
 * - `/api/v1/products` — Product catalog and product images.
 * - `/api/v1/users`    — User profile.
 *
 * The `errorHandler` middleware is registered last to catch all errors
 * forwarded via `next(error)`.
 */
export const app = express();

app.use(pinoHttp({ logger }));
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(apiRateLimiter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
setupSwagger(app);

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API healthy
 */
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "integra360-backend"
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/products", productImageRoutes);
app.use("/api/v1/users", userRoutes);

app.use(errorHandler);
