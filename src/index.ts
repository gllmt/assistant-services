import { buildServer } from "./server.js";

async function main() {
  const server = buildServer();

  try {
    await server.listen({
      host: server.appConfig.HOST,
      port: server.appConfig.PORT
    });

    server.log.info(
      {
        host: server.appConfig.HOST,
        port: server.appConfig.PORT
      },
      "server listening"
    );
  } catch (error) {
    server.log.error({ error }, "failed to start server");
    process.exit(1);
  }
}

await main();
