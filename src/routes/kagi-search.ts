import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";
import { createOpenClawWebSearchResponse } from "../integrations/openclaw/responses.js";
import { debugKagiSearch, searchWithKagi } from "../services/kagi/client.js";
import { kagiSearchQuerySchema } from "../schemas/kagi-search.js";

export async function registerKagiSearchRoutes(server: FastifyInstance) {
  server.get("/kagi/debug", async (request, reply) => {
    try {
      const query = kagiSearchQuerySchema.parse(request.query);

      const result = await debugKagiSearch({
        apiKey: server.appConfig.KAGI_API_KEY,
        baseUrl: server.appConfig.KAGI_BASE_URL,
        webBaseUrl: server.appConfig.KAGI_WEB_BASE_URL,
        query: query.q,
        count: query.count,
        mode: server.appConfig.KAGI_SEARCH_MODE,
        sessionLink: server.appConfig.KAGI_SESSION_LINK,
        sessionToken: server.appConfig.KAGI_SESSION_TOKEN,
        browserExecutablePath: server.appConfig.KAGI_BROWSER_EXECUTABLE_PATH,
        browserProfileDir: server.appConfig.KAGI_BROWSER_PROFILE_DIR,
        browserHeadless: server.appConfig.KAGI_BROWSER_HEADLESS
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.name,
          message: error.message
        });
      }

      return reply.code(400).send({
        error: "BadRequest",
        message: error instanceof Error ? error.message : "Invalid request"
      });
    }
  });

  server.get("/kagi", async (request, reply) => {
    try {
      const query = kagiSearchQuerySchema.parse(request.query);

      const result = await searchWithKagi({
        apiKey: server.appConfig.KAGI_API_KEY,
        baseUrl: server.appConfig.KAGI_BASE_URL,
        webBaseUrl: server.appConfig.KAGI_WEB_BASE_URL,
        query: query.q,
        count: query.count,
        mode: server.appConfig.KAGI_SEARCH_MODE,
        sessionLink: server.appConfig.KAGI_SESSION_LINK,
        sessionToken: server.appConfig.KAGI_SESSION_TOKEN,
        browserExecutablePath: server.appConfig.KAGI_BROWSER_EXECUTABLE_PATH,
        browserProfileDir: server.appConfig.KAGI_BROWSER_PROFILE_DIR,
        browserHeadless: server.appConfig.KAGI_BROWSER_HEADLESS
      });

      return createOpenClawWebSearchResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.name,
          message: error.message
        });
      }

      return reply.code(400).send({
        error: "BadRequest",
        message: error instanceof Error ? error.message : "Invalid request"
      });
    }
  });
}
