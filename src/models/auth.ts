import { Collection, ObjectId } from "mongodb";
import { database, AuthCodeDocument } from "../util/database";

export class AuthService {
  private getCollection(): Collection {
    return database.getCollection("codes");
  }

  async findOneAndUpdate(ip: string, authCode: string): Promise<AuthCodeDocument | null> {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { ip },
      {
        $set: {
          authCode,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (result) {
      return {
        _id: result._id.toString(),
        authCode: result.authCode,
        ip: result.ip,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      } as AuthCodeDocument;
    }
    return null;
  }

  async create(authCode: string, ip: string): Promise<AuthCodeDocument> {
    const collection = this.getCollection();
    const now = new Date();

    const document = {
      authCode,
      ip,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(document);
    return { ...document, _id: result.insertedId.toString() };
  }

  async findById(id: string): Promise<AuthCodeDocument | null> {
    const collection = this.getCollection();
    const result = await collection.findOne({ _id: new ObjectId(id) });

    if (result) {
      return {
        _id: result._id.toString(),
        authCode: result.authCode,
        ip: result.ip,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      } as AuthCodeDocument;
    }
    return null;
  }

  async findByIp(ip: string): Promise<AuthCodeDocument | null> {
    const collection = this.getCollection();
    const result = await collection.findOne({ ip });

    if (result) {
      return {
        _id: result._id.toString(),
        authCode: result.authCode,
        ip: result.ip,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      } as AuthCodeDocument;
    }
    return null;
  }
}

export const authService = new AuthService();
