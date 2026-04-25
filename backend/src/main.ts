import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./common/logger/logger.js";

app.listen(env.PORT, () => {
  logger.info(`Backend running on port ${env.PORT}`);
});
