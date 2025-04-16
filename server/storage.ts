import { users, type User, type InsertUser, type Report, type InsertReport } from "@shared/schema";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report methods
  getReport(shareId: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(shareId: string): Promise<boolean>;
  init(): Promise<void>;
}

export class SQLiteStorage implements IStorage {
  private db: ReturnType<typeof Database> | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Allow database path to be specified via environment variable or constructor parameter
    this.dbPath = dbPath || 
      process.env.SQLITE_DB_PATH || 
      path.join(process.cwd(), "data", "reports.db");
    
    console.log(`SQLite database path: ${this.dbPath}`);
  }

  async init(): Promise<void> {
    // Create the data directory if it doesn't exist
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open the database - better-sqlite3 uses a synchronous API
    if (!this.db) {
      try {
        // Using Type assertion to handle the constructor signature issue
        this.db = new Database(this.dbPath) as ReturnType<typeof Database>;
        
        // Create tables if they don't exist
        this.db?.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          )
        `);
        
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            share_id TEXT NOT NULL UNIQUE,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            user_id INTEGER
          )
        `);
      } catch (error) {
        console.error("Error initializing SQLite database:", error);
        throw error;
      }
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!this.db) await this.init();
    try {
      const user = this.db!.prepare("SELECT * FROM users WHERE id = ?").get(id);
      return user as User | undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) await this.init();
    try {
      const user = this.db!.prepare("SELECT * FROM users WHERE username = ?").get(username);
      return user as User | undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) await this.init();
    try {
      const stmt = this.db!.prepare(
        "INSERT INTO users (username, password) VALUES (?, ?)"
      );
      
      const result = stmt.run(
        insertUser.username,
        insertUser.password
      );
      
      return { 
        id: Number(result.lastInsertRowid), 
        ...insertUser 
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getReport(shareId: string): Promise<Report | undefined> {
    if (!this.db) await this.init();
    try {
      const report = this.db!.prepare("SELECT * FROM reports WHERE share_id = ?").get(shareId);
      if (!report) return undefined;
      
      // Parse the JSON data
      const typedReport = report as { 
        id: number; 
        share_id: string; 
        data: string;
        created_at: string;
        description?: string;
        user_id?: number;
      };
      
      return {
        id: typedReport.id,
        shareId: typedReport.share_id,
        data: JSON.parse(typedReport.data),
        createdAt: new Date(typedReport.created_at),
        description: typedReport.description || null,
        userId: typedReport.user_id || null
      } as Report;
    } catch (error) {
      console.error("Error getting report:", error);
      return undefined;
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    if (!this.db) await this.init();
    try {
      // Convert the data object to a JSON string
      const jsonData = JSON.stringify(report.data);
      
      const stmt = this.db!.prepare(
        "INSERT INTO reports (share_id, data, description, user_id) VALUES (?, ?, ?, ?)"
      );
      
      const result = stmt.run(
        report.shareId,
        jsonData,
        report.description || null,
        report.userId || null
      );
      
      return { 
        id: Number(result.lastInsertRowid),
        shareId: report.shareId,
        data: report.data,
        createdAt: new Date(),
        description: report.description || null,
        userId: report.userId || null
      } as Report;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  async deleteReport(shareId: string): Promise<boolean> {
    if (!this.db) await this.init();
    try {
      const result = this.db!.prepare("DELETE FROM reports WHERE share_id = ?").run(shareId);
      return result.changes > 0;
    } catch (error) {
      console.error("Error deleting report:", error);
      return false;
    }
  }
}

// Initialize SQLite storage
export const storage = new SQLiteStorage();
