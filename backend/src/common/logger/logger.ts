import pino from "pino";
import { env } from "../../config/env.js";

/**
 * Application-wide Pino logger instance.
 *
 * - In **development** the transport is set to `pino-pretty` for
 *   colourised, human-readable output with translated timestamps.
 * - In **production** structured JSON lines are written to stdout so
 *   that log aggregators (e.g. Datadog, CloudWatch) can parse them.
 *
 * Log level is automatically set to `"debug"` in non-production
 * environments and `"info"` in production.
 */
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
});
