import "dotenv/config";
import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SWAGGER_ENABLED: z.enum(["true", "false"]).optional(),
  SWAGGER_USERNAME: z.string().min(1).optional(),
  SWAGGER_PASSWORD: z.string().min(1).optional()
});

const parsed = baseEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const swaggerEnabled = parsed.data.SWAGGER_ENABLED
  ? parsed.data.SWAGGER_ENABLED === "true"
  : parsed.data.NODE_ENV !== "production";

if (
  parsed.data.NODE_ENV === "production" &&
  swaggerEnabled &&
  (!parsed.data.SWAGGER_USERNAME || !parsed.data.SWAGGER_PASSWORD)
) {
  console.error(
    "In production, SWAGGER_USERNAME and SWAGGER_PASSWORD are required when Swagger is enabled"
  );
  process.exit(1);
}

export const env = {
  ...parsed.data,
  SWAGGER_ENABLED: swaggerEnabled
};
