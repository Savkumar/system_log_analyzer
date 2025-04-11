import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to serve log file content
  app.get('/api/logs', (req, res) => {
    try {
      // Read the log file from attached_assets
      const logFilePath = path.resolve(process.cwd(), 'attached_assets/paste-2.txt');
      const logContent = fs.readFileSync(logFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading log file:', error);
      res.status(500).send('Error reading log file');
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
