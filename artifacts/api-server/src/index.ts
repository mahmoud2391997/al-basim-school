import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "@workspace/db/seed";

const rawPort = process.env["API_PORT"] || process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    const seeded = await seedDatabase();
    if (seeded) logger.info("Seeded initial school data");
  } catch (error) {
    logger.warn({ err: error }, "Could not seed database on startup");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start();
