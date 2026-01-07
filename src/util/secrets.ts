import dotenv from 'dotenv';
import fs from "fs";
import logger from "./logging";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables", {
        context: "secrets_init",
    });
    dotenv.config({ path: ".env" });
}

export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production";
export const MONGODB_URI = prod ? process.env["MONGODB_URI"] : process.env["MONGODB_URI_LOCAL"];
export const BOT_URL = process.env["BOT_URL"];

if (!BOT_URL) {
    logger.warn("BOT_URL not set. Set BOT_URL environment variable.", {
        context: "secrets_init",
    });
}

if (!MONGODB_URI) {
    if (prod) {
        logger.warn("MongoDB URI not set. Set MONGODB_URI environment variable.", {
            context: "secrets_init",
            environment: "production",
        });
    } else {
        logger.warn("MongoDB URI not set. Set MONGODB_URI_LOCAL environment variable.", {
            context: "secrets_init",
            environment: "development",
        });
    }
}
