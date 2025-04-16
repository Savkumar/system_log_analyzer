import { type User, type InsertUser, type Report, type InsertReport } from "@shared/schema";
import fs from "fs";
import path from "path";

// Storage interface - same as before
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

export class FileStorage implements IStorage {
  private usersPath: string;
  private reportsPath: string;
  private initialized: boolean = false;
  private users: Map<number, User> = new Map();
  private nextUserId: number = 1;

  constructor(dataDir?: string) {
    const baseDir = dataDir || path.join(process.cwd(), "data");
    this.usersPath = path.join(baseDir, "users.json");
    this.reportsPath = path.join(baseDir, "reports");
    console.log(`File storage initialized with reports path: ${this.reportsPath}`);
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.reportsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create reports directory if it doesn't exist
      if (!fs.existsSync(this.reportsPath)) {
        fs.mkdirSync(this.reportsPath, { recursive: true });
      }

      // Load users if the file exists
      if (fs.existsSync(this.usersPath)) {
        const usersData = fs.readFileSync(this.usersPath, 'utf8');
        const usersArray = JSON.parse(usersData);
        
        this.users.clear();
        let maxId = 0;
        
        for (const user of usersArray) {
          this.users.set(user.id, user as User);
          maxId = Math.max(maxId, user.id);
        }
        
        this.nextUserId = maxId + 1;
      } else {
        // Initialize users file with empty array
        fs.writeFileSync(this.usersPath, JSON.stringify([]));
      }

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing file storage:", error);
      throw error;
    }
  }

  private saveUsers(): void {
    const usersArray = Array.from(this.users.values());
    fs.writeFileSync(this.usersPath, JSON.stringify(usersArray, null, 2));
  }

  private getReportFilePath(shareId: string): string {
    return path.join(this.reportsPath, `${shareId}.json`);
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!this.initialized) await this.init();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.initialized) await this.init();
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.initialized) await this.init();
    
    const id = this.nextUserId++;
    const user = { ...insertUser, id };
    
    this.users.set(id, user as User);
    this.saveUsers();
    
    return user as User;
  }

  async getReport(shareId: string): Promise<Report | undefined> {
    if (!this.initialized) await this.init();
    
    try {
      const reportPath = this.getReportFilePath(shareId);
      
      if (!fs.existsSync(reportPath)) {
        return undefined;
      }
      
      const reportData = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      return {
        id: report.id,
        shareId: report.shareId,
        data: report.data,
        createdAt: new Date(report.createdAt),
        description: report.description || null,
        userId: report.userId || null
      } as Report;
    } catch (error) {
      console.error(`Error getting report ${shareId}:`, error);
      return undefined;
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    if (!this.initialized) await this.init();
    
    try {
      // Get existing reports to determine next ID
      const reportFiles = fs.readdirSync(this.reportsPath);
      let maxId = 0;
      
      for (const file of reportFiles) {
        if (file.endsWith('.json')) {
          try {
            const reportData = fs.readFileSync(path.join(this.reportsPath, file), 'utf8');
            const existingReport = JSON.parse(reportData);
            if (existingReport.id) {
              maxId = Math.max(maxId, existingReport.id);
            }
          } catch (err) {
            // Skip invalid files
            console.warn(`Skipping invalid report file: ${file}`);
          }
        }
      }
      
      // Create the full report object
      const fullReport = {
        id: maxId + 1,
        shareId: report.shareId,
        data: report.data,
        createdAt: new Date().toISOString(),
        description: report.description || null,
        userId: report.userId || null
      };
      
      // Save to file
      const reportPath = this.getReportFilePath(report.shareId);
      fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
      
      // Return the report with proper date handling
      return {
        ...fullReport,
        createdAt: new Date(fullReport.createdAt)
      } as Report;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  async deleteReport(shareId: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    
    try {
      const reportPath = this.getReportFilePath(shareId);
      
      if (!fs.existsSync(reportPath)) {
        return false;
      }
      
      fs.unlinkSync(reportPath);
      return true;
    } catch (error) {
      console.error(`Error deleting report ${shareId}:`, error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const storage = new FileStorage();
