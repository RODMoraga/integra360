import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./common/logger/logger.js";

// Start the HTTP server on the port specified in the environment configuration.
app.listen(env.PORT, () => {
  logger.info(`Backend running on port ${env.PORT}`);
});
