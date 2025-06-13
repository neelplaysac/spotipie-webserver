import { MongoClient, Db, Collection } from "mongodb";
import { MONGODB_URI } from "./secrets";

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (!MONGODB_URI) {
      throw new Error("MongoDB URI is not provided");
    }
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db("spotipie");
      console.log("Connected to MongoDB successfully (database: spotipie)");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("Disconnected from MongoDB");
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
