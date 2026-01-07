import { MongoClient, Db, Collection } from "mongodb";
import { MONGODB_URI } from "./secrets";
import logger, { logError } from "./logging";

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (!MONGODB_URI) {
      const error = new Error("MongoDB URI is not provided");
      logger.error({
        message: "MongoDB connection failed: URI not provided",
        context: "database_connect",
      });
      throw error;
    }
    try {
      logger.info("Attempting to connect to MongoDB", {
        context: "database_connect",
        database: "spotipie",
      });
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db("spotipie");
      logger.info("Connected to MongoDB successfully", {
        context: "database_connect",
        database: "spotipie",
      });
    } catch (error) {
      logError(logger, error, {
        context: "database_connect",
        database: "spotipie",
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        logger.info("Disconnecting from MongoDB", {
          context: "database_disconnect",
        });
        await this.client.close();
        this.client = null;
        this.db = null;
        logger.info("Disconnected from MongoDB successfully", {
          context: "database_disconnect",
        });
      } catch (error) {
        logError(logger, error, {
          context: "database_disconnect",
        });
        throw error;
      }
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  getCollection(name: string): Collection {
    return this.getDatabase().collection(name);
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

export const database = new DatabaseConnection();

export interface AuthCodeDocument {
  _id?: string;
  authCode: string;
  ip: string;
  createdAt?: Date;
  updatedAt?: Date;
}
