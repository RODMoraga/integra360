import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client instance shared across the entire application.
 *
 * A single instance is exported here to avoid opening multiple database
 * connection pools, which would exhaust the configured MySQL connection
 * limit under load.
 */
export const prisma = new PrismaClient();
