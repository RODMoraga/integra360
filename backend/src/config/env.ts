import "dotenv/config";
import { z } from "zod";

// Comprehensive environment schema for Integra360
// Validates all variables on startup to prevent runtime errors
const baseEnvSchema = z.object({
  // ============================================================================
  // Environment & Execution
  // ============================================================================
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development")
    .describe("Execution environment"),
  PORT: z
    .coerce.number()
    .positive()
    .max(65535)
    .default(3000)
    .describe("Server listening port"),
  DEBUG: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true")
    .describe("Enable debug mode"),

  // ============================================================================
  // Database
  // ============================================================================
  DATABASE_URL: z
    .string()
    .min(1)
    .regex(/^mysql:\/\//, "Must be a valid MySQL connection string")
    .describe("Prisma database connection URL"),
  DB_LOG_LEVEL: z
    .enum(["query", "info", "warn", "error"])
    .default("warn")
    .describe("Database logging level"),

  // ============================================================================
  // Authentication & Security
  // ============================================================================
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "Must be at least 32 characters for security")
    .describe("Secret key for signing access tokens"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "Must be at least 32 characters for security")
    .describe("Secret key for signing refresh tokens"),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m")
    .describe("Access token expiration time"),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("7d")
    .describe("Refresh token expiration time"),
  JWT_ALGORITHM: z
    .enum(["HS256", "RS256"])
    .default("HS256")
    .describe("JWT signing algorithm"),
  APP_KEY: z
    .string()
    .min(32)
    .optional()
    .describe("Master application encryption key"),

  // ============================================================================
  // CORS & API
  // ============================================================================
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .describe("Allowed CORS origin(s), comma-separated for multiple"),
  API_PUBLIC_BASE_URL: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .describe("Public base URL for API docs/server metadata (e.g. https://api.integra360.com)"),
  CORS_METHODS: z
    .string()
    .default("GET,HEAD,PUT,PATCH,POST,DELETE")
    .describe("Allowed HTTP methods for CORS"),
  CORS_CREDENTIALS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true")
    .describe("Allow credentials in CORS requests"),

  // ============================================================================
  // API Documentation (Swagger)
  // ============================================================================
  SWAGGER_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .describe("Enable/disable Swagger UI"),
  SWAGGER_USERNAME: z
    .string()
    .min(1)
    .optional()
    .describe("Username for Swagger authentication (prod only)"),
  SWAGGER_PASSWORD: z
    .string()
    .min(8)
    .optional()
    .describe("Password for Swagger authentication (prod only)"),

  // ============================================================================
  // Logging
  // ============================================================================
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info")
    .describe("Minimum log level"),
  LOG_FORMAT: z
    .enum(["pretty", "json"])
    .default("pretty")
    .describe("Log output format"),
  LOG_FILE: z
    .string()
    .optional()
    .describe("Optional log file path"),

  // ============================================================================
  // Localization (Regional)
  // ============================================================================
  TZ: z
    .string()
    .default("America/Santiago")
    .describe("Application timezone"),
  LOCALE: z
    .string()
    .default("es-CL")
    .describe("Language and region code"),
  CURRENCY: z
    .string()
    .length(3)
    .default("CLP")
    .describe("ISO 4217 currency code"),
  CURRENCY_SYMBOL: z
    .string()
    .default("$")
    .describe("Currency symbol for display"),
  DATE_FORMAT: z
    .string()
    .default("DD/MM/YYYY")
    .describe("Date format for display"),
  TIME_FORMAT: z
    .string()
    .default("HH:mm:ss")
    .describe("Time format for display"),
  NUMBER_DECIMAL_SEPARATOR: z
    .string()
    .default(",")
    .describe("Decimal separator for numbers"),
  NUMBER_THOUSANDS_SEPARATOR: z
    .string()
    .default(".")
    .describe("Thousands separator for numbers"),

  // ============================================================================
  // Rate Limiting
  // ============================================================================
  RATE_LIMIT_WINDOW: z
    .coerce.number()
    .default(15)
    .describe("Rate limit window in minutes"),
  RATE_LIMIT_MAX_REQUESTS: z
    .coerce.number()
    .default(100)
    .describe("Max requests per window per IP"),

  // ============================================================================
  // Cache
  // ============================================================================
  CACHE_DRIVER: z
    .enum(["memory", "redis", "memcached", "file"])
    .default("memory")
    .describe("Cache storage driver"),
  CACHE_REDIS_URL: z
    .string()
    .optional()
    .describe("Redis connection URL for cache"),
  CACHE_TTL: z
    .coerce.number()
    .default(3600)
    .describe("Default cache TTL in seconds"),

  // ============================================================================
  // Sessions
  // ============================================================================
  SESSION_DRIVER: z
    .enum(["memory", "file", "redis", "database"])
    .default("memory")
    .describe("Session storage driver"),
  SESSION_COOKIE_NAME: z
    .string()
    .default("INTEGRA360_SESSION")
    .describe("Session cookie name"),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true")
    .describe("Only send cookie over HTTPS"),
  SESSION_COOKIE_HTTP_ONLY: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true")
    .describe("Prevent JavaScript access to session cookie"),
  SESSION_COOKIE_SAME_SITE: z
    .enum(["Strict", "Lax", "None"])
    .default("Lax")
    .describe("SameSite cookie policy"),
  SESSION_TIMEOUT: z
    .coerce.number()
    .default(480)
    .describe("Session timeout in minutes"),

  // ============================================================================
  // Job Queue
  // ============================================================================
  QUEUE_DRIVER: z
    .enum(["memory", "redis", "database", "aws_sqs"])
    .default("memory")
    .describe("Job queue driver"),
  QUEUE_REDIS_URL: z
    .string()
    .optional()
    .describe("Redis connection URL for queues"),
  QUEUE_RETRY_AFTER: z
    .coerce.number()
    .default(5)
    .describe("Minutes before retrying failed job"),
  QUEUE_RETRY_MAX: z
    .coerce.number()
    .default(3)
    .describe("Max retries for failed job"),

  // ============================================================================
  // Email
  // ============================================================================
  MAIL_FROM_ADDRESS: z
    .string()
    .email()
    .default("noreply@integra360.com")
    .describe("From email address"),
  MAIL_FROM_NAME: z
    .string()
    .default("Integra360")
    .describe("From email name"),
  MAIL_DRIVER: z
    .enum(["smtp", "sendgrid", "mailgun", "ses"])
    .default("smtp")
    .describe("Email service driver"),
  MAIL_HOST: z
    .string()
    .optional()
    .describe("SMTP host"),
  MAIL_PORT: z
    .coerce.number()
    .optional()
    .describe("SMTP port"),
  MAIL_USERNAME: z
    .string()
    .optional()
    .describe("SMTP username"),
  MAIL_PASSWORD: z
    .string()
    .optional()
    .describe("SMTP password or API token"),
  MAIL_ENCRYPTION: z
    .enum(["tls", "ssl", "null"])
    .default("tls")
    .describe("SMTP encryption type"),

  // ============================================================================
  // Payment Provider
  // ============================================================================
  PAYMENT_PROVIDER: z
    .enum(["stripe", "mercadopago", "paypal"])
    .optional()
    .describe("Payment provider name"),
  STRIPE_PUBLIC_KEY: z
    .string()
    .optional()
    .describe("Stripe public key"),
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .describe("Stripe secret key"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional()
    .describe("Stripe webhook signing secret"),

  // ============================================================================
  // Storage
  // ============================================================================
  STORAGE_DRIVER: z
    .enum(["local", "s3", "gcs"])
    .default("local")
    .describe("File storage driver"),
  STORAGE_DISK_PATH: z
    .string()
    .default("storage/uploads")
    .describe("Local disk storage path"),
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .describe("AWS access key"),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .describe("AWS secret access key"),
  AWS_DEFAULT_REGION: z
    .string()
    .default("us-east-1")
    .describe("AWS region"),
  AWS_BUCKET: z
    .string()
    .optional()
    .describe("AWS S3 bucket name"),

  // ============================================================================
  // Feature Flags
  // ============================================================================
  FEATURE_RBAC: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true")
    .describe("Enable role-based access control"),
  FEATURE_TWO_FACTOR_AUTH: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true")
    .describe("Enable two-factor authentication"),
  FEATURE_AUDIT_LOG: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true")
    .describe("Enable audit logging"),
  FEATURE_API_VERSIONING: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true")
    .describe("Enable API versioning"),

  // ============================================================================
  // Error Tracking
  // ============================================================================
  SENTRY_DSN: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .describe("Sentry error tracking URL or empty string"),
  SENTRY_ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .optional()
    .describe("Sentry environment for error grouping"),

  // ============================================================================
  // Advanced
  // ============================================================================
  REQUEST_TIMEOUT: z
    .coerce.number()
    .default(30)
    .describe("Request timeout in seconds"),
});

// Validate environment on startup
const parsed = baseEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  console.error("\n❌ Invalid environment variables:\n");
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  ${field}: ${messages?.join(", ")}`);
  });
  console.error("\n📖 Check .env.example for correct format\n");
  process.exit(1);
}

// Additional validation for Swagger in production
const swaggerEnabled = parsed.data.SWAGGER_ENABLED
  ? parsed.data.SWAGGER_ENABLED === "true"
  : parsed.data.NODE_ENV !== "production";

if (
  parsed.data.NODE_ENV === "production" &&
  swaggerEnabled &&
  (!parsed.data.SWAGGER_USERNAME || !parsed.data.SWAGGER_PASSWORD)
) {
  console.error("\n❌ Swagger Configuration Error:\n");
  console.error("  In production, when SWAGGER_ENABLED=true, you must provide:");
  console.error("  - SWAGGER_USERNAME");
  console.error("  - SWAGGER_PASSWORD (minimum 8 characters)\n");
  process.exit(1);
}

// Convert string booleans to actual booleans for variables that need it
const normalizedEnv = {
  ...parsed.data,
  SWAGGER_ENABLED: swaggerEnabled,
};

/**
 * Validated and type-safe application environment configuration.
 *
 * All values are parsed from `process.env` at startup using a Zod schema.
 * If any required variable is missing or invalid the process exits with a
 * non-zero code and a descriptive error message.
 *
 * Import this object instead of reading `process.env` directly anywhere in
 * the codebase to guarantee type safety and consistent defaults.
 */
export const env = normalizedEnv;

// Log loaded environment in development
if (env.NODE_ENV === "development") {
  console.log("\n✅ Environment loaded successfully");
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   Timezone: ${env.TZ}`);
  console.log(`   Currency: ${env.CURRENCY}`);
  console.log(`   Swagger: ${env.SWAGGER_ENABLED ? "enabled" : "disabled"}\n`);
}
