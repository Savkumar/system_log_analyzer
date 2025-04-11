import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import zlib from 'zlib';
import { promisify } from 'util';

export async function registerRoutes(app: Express): Promise<Server> {
  // Current log file path
  let activeLogFilePath = path.resolve(process.cwd(), 'attached_assets/paste-2.txt');

  // API endpoint to serve log file content
  app.get('/api/logs', (req, res) => {
    try {
      const logContent = fs.readFileSync(activeLogFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading log file:', error);
      res.status(500).send('Error reading log file');
    }
  });

  // API endpoint to upload and process gzipped log files
  app.post('/api/upload-log', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.logFile as UploadedFile;
      
      // Check if the file is a .gz file
      if (!logFile.name.endsWith('.gz')) {
        return res.status(400).json({ message: 'Please upload a .gz file' });
      }

      // Create a temporary file path
      const tempFilePath = logFile.tempFilePath;
      
      try {
        // Read the gzipped file
        const gzippedData = fs.readFileSync(tempFilePath);
        
        // Decompress the gzipped data
        const gunzip = promisify(zlib.gunzip);
        const decompressedData = await gunzip(gzippedData);
        
        // Convert to string
        const logContent = decompressedData.toString('utf8');
        
        // Save the decompressed file to a temporary location
        const decompressedFilePath = path.join('/tmp', `log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active log file path
        activeLogFilePath = decompressedFilePath;
        
        // Return success
        return res.status(200).json({ 
          message: 'Log file uploaded and processed successfully',
          lines: logContent.split('\n').length
        });
      } catch (error) {
        console.error('Error processing gzipped file:', error);
        return res.status(500).json({ message: 'Error processing gzipped file' });
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
