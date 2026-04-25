import type { Express, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.js";

function createSwaggerSpec(): object {
  return {
    openapi: "3.0.3",
    info: {
      title: "Integra360 API",
      version: "1.0.0",
      description: "Documentacion de endpoints del backend Integra360"
    },
    servers: [
      {
        url: env.API_PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}`,
        description: env.API_PUBLIC_BASE_URL ? "Public" : "Local"
      }
    ],
    tags: [
      { name: "System", description: "System and health endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User profile endpoints" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "Secret123!" }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "Secret123!" }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" }
          }
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            role: { type: "string", example: "USER" }
          }
        }
      }
    },
    paths: {
      "/api/v1/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: {
              description: "API healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      service: { type: "string", example: "integra360-backend" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" }
              }
            }
          },
          responses: {
            201: {
              description: "Tokens generated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "Tokens generated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get current profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Authenticated user profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserProfile" }
                }
              }
            },
            401: {
              description: "Unauthorized"
            }
          }
        }
      }
    }
  };
}

let cachedSwaggerSpec: object | null = null;

function getSwaggerSpec(): object {
  if (!cachedSwaggerSpec) {
    cachedSwaggerSpec = createSwaggerSpec();
  }

  return cachedSwaggerSpec;
}

function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const username = env.SWAGGER_USERNAME;
  const password = env.SWAGGER_PASSWORD;

  if (!username || !password) {
    next();
    return;
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const encoded = header.replace("Basic ", "").trim();
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const requestUsername = decoded.slice(0, separatorIndex);
  const requestPassword = decoded.slice(separatorIndex + 1);

  if (requestUsername !== username || requestPassword !== password) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
}

export function setupSwagger(app: Express): void {
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  app.use("/api-docs", basicAuth, swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
    const spec = getSwaggerSpec();
    return swaggerUi.setup(spec)(req, res, next);
  });

  app.get("/api-docs.json", basicAuth, (_req, res) => {
    res.json(getSwaggerSpec());
  });
}
