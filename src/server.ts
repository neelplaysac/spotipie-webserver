import express from "express";
import { database } from "./util/database";
import * as callbackController from "./routes/callback";
import { MONGODB_URI } from "./util/secrets";

const app = express();

app.use(express.json());

app.get("/", callbackController.homeRoute);
app.get("/callback", callbackController.callbackRoute);

process.on("unhandledRejection", (ex) => {
  throw ex;
});

// Connect to MongoDB
async function startServer() {
  try {
    if (MONGODB_URI) {
      await database.connect();
    } else {
      console.log("No MongoDB URI provided. Running without database connection.");
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }

  const port = process.env.PORT || 6969;
  app.listen(port, () => console.log(`Listening on port ${port}...`));
}

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await database.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await database.disconnect();
  process.exit(0);
});

startServer().catch(console.error);
