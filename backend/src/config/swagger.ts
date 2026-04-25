import type { Express, NextFunction, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.js";

const openApiDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Integra360 API",
    version: "1.0.0",
    description: "Documentacion automatica de endpoints del backend Integra360"
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
};

const options: swaggerJsdoc.Options = {
  definition: openApiDefinition,
  apis: ["src/app.ts", "src/modules/**/*.ts", "dist/app.js", "dist/modules/**/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

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

  app.use("/api-docs", basicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", basicAuth, (_req, res) => {
    res.json(swaggerSpec);
  });
}
