import Fastify from "fastify";

import { env } from "./config/env.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerKagiSearchRoutes } from "./routes/kagi-search.js";

export function buildServer() {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  server.decorate("appConfig", env);

  server.register(registerHealthRoutes);
  server.register(registerKagiSearchRoutes, { prefix: "/search" });

  return server;
}

declare module "fastify" {
  interface FastifyInstance {
    appConfig: typeof env;
  }
}
