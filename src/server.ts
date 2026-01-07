import express from "express";
import { database } from "./util/database";
import * as callbackController from "./routes/callback";
import { MONGODB_URI } from "./util/secrets";
import logger, { logError } from "./util/logging";
import { requestIdMiddleware, errorLoggingMiddleware } from "./util/middleware";

const app = express();
app.set("trust proxy", true);
app.use(express.json());

// Add request ID middleware before routes
app.use(requestIdMiddleware);

app.get("/", callbackController.homeRoute);
app.get("/callback", callbackController.callbackRoute);

// Error logging middleware (should be after routes but before error handler)
app.use(errorLoggingMiddleware);

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  logError(logger, reason, {
    context: "unhandledRejection",
  });
  // Don't throw, let the rejection handler log it
});

// Global error handler for uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logError(logger, error, {
    context: "uncaughtException",
  });
  process.exit(1);
});

// Connect to MongoDB
async function startServer() {
  try {
    if (MONGODB_URI) {
      await database.connect();
      logger.info("MongoDB connection established", {
        context: "startServer",
      });
    } else {
      logger.warn("No MongoDB URI provided. Running without database connection.", {
        context: "startServer",
      });
    }
  } catch (error) {
    logError(logger, error, {
      context: "startServer",
      action: "database_connection",
    });
    process.exit(1);
  }

  const port = process.env.PORT || 6969;
  app.listen(port, () => {
    logger.info(`Server started and listening on port ${port}`, {
      context: "startServer",
      port: Number(port),
    });
  });
}

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...", {
    context: "shutdown",
  });
  try {
    await database.disconnect();
    logger.info("Database disconnected successfully", {
      context: "shutdown",
    });
  } catch (error) {
    logError(logger, error, {
      context: "shutdown",
      action: "database_disconnect",
    });
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...", {
    context: "shutdown",
  });
  try {
    await database.disconnect();
    logger.info("Database disconnected successfully", {
      context: "shutdown",
    });
  } catch (error) {
    logError(logger, error, {
      context: "shutdown",
      action: "database_disconnect",
    });
  }
  process.exit(0);
});

startServer().catch((error) => {
  logError(logger, error, {
    context: "startServer",
    action: "server_startup",
  });
  process.exit(1);
});
