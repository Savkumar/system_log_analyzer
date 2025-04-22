import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./file-storage"; // Changed from SQLite to file-based storage
import { insertReportSchema } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import zlib from 'zlib';
import { promisify } from 'util';

export async function registerRoutes(app: Express): Promise<Server> {
  // Current log file paths
  let activeLogFilePath = path.resolve(process.cwd(), 'attached_assets/paste-2.txt');
  let activeRPMLogFilePath = path.resolve(process.cwd(), 'attached_assets/Overall_RPM.txt');
  let activeRPSLogFilePath = path.resolve(process.cwd(), 'attached_assets/Overall_RPS.txt');
  let activeGhostmonLogFilePath = path.resolve(process.cwd(), 'attached_assets/23.210.6.29_ghostmon.log.gz');
  let activeARLRPMLogFilePath = path.resolve(process.cwd(), 'attached_assets/ARL_RPM.txt');
  let activeARLRPSLogFilePath = path.resolve(process.cwd(), 'attached_assets/ARL_RPS.txt');

  // API endpoint to serve main log file content
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
  
  // API endpoint to serve RPM log file content
  app.get('/api/ghost/rpm', (req, res) => {
    try {
      const logContent = fs.readFileSync(activeRPMLogFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading RPM log file:', error);
      res.status(500).send('Error reading RPM log file');
    }
  });
  
  // API endpoint to serve RPS log file content
  app.get('/api/ghost/rps', (req, res) => {
    try {
      const logContent = fs.readFileSync(activeRPSLogFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading RPS log file:', error);
      res.status(500).send('Error reading RPS log file');
    }
  });
  
  // API endpoint to serve Ghostmon log file content
  app.get('/api/ghostmon', async (req, res) => {
    try {
      // Check if file is gzipped
      if (activeGhostmonLogFilePath.endsWith('.gz')) {
        // Read and decompress gzipped file
        const gzippedData = fs.readFileSync(activeGhostmonLogFilePath);
        const gunzip = promisify(zlib.gunzip);
        const decompressedData = await gunzip(gzippedData);
        const logContent = decompressedData.toString('utf8');
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(logContent);
      } else {
        // Read regular file
        const logContent = fs.readFileSync(activeGhostmonLogFilePath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(logContent);
      }
    } catch (error) {
      console.error('Error reading Ghostmon log file:', error);
      res.status(500).send('Error reading Ghostmon log file');
    }
  });

  // API endpoint to upload and process gzipped log files
  app.post('/api/upload-log', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.logFile as UploadedFile;
      
      // Create a temporary file path
      const tempFilePath = logFile.tempFilePath;
      
      try {
        let logContent: string;
        
        // Check file extension and process accordingly
        if (logFile.name.endsWith('.gz')) {
          // Process gzipped file
          const gzippedData = fs.readFileSync(tempFilePath);
          const gunzip = promisify(zlib.gunzip);
          const decompressedData = await gunzip(gzippedData);
          logContent = decompressedData.toString('utf8');
        } 
        else if (logFile.name.endsWith('.log') || logFile.name.endsWith('.txt')) {
          // Process plain text files
          logContent = fs.readFileSync(tempFilePath, 'utf8');
        }
        else {
          return res.status(400).json({ 
            message: 'Unsupported file format. Please upload a .gz, .log, or .txt file' 
          });
        }
        
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
        console.error('Error processing log file:', error);
        return res.status(500).json({ message: 'Error processing log file' });
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
  
  // API endpoint to upload and process ghost RPM log files
  app.post('/api/ghost/upload-rpm', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.logFile as UploadedFile;
      const tempFilePath = logFile.tempFilePath;
      
      try {
        let logContent: string;
        
        // Process the file based on extension
        if (logFile.name.endsWith('.gz')) {
          const gzippedData = fs.readFileSync(tempFilePath);
          const gunzip = promisify(zlib.gunzip);
          const decompressedData = await gunzip(gzippedData);
          logContent = decompressedData.toString('utf8');
        } 
        else if (logFile.name.endsWith('.log') || logFile.name.endsWith('.txt')) {
          logContent = fs.readFileSync(tempFilePath, 'utf8');
        }
        else {
          return res.status(400).json({ 
            message: 'Unsupported file format. Please upload a .gz, .log, or .txt file' 
          });
        }
        
        // Save the decompressed file
        const decompressedFilePath = path.join('/tmp', `rpm_log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active RPM log file path
        activeRPMLogFilePath = decompressedFilePath;
        
        return res.status(200).json({ 
          message: 'RPM log file uploaded and processed successfully',
          lines: logContent.split('\n').length
        });
      } catch (error) {
        console.error('Error processing RPM log file:', error);
        return res.status(500).json({ message: 'Error processing RPM log file' });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in RPM file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // API endpoint to upload and process ghost RPS log files
  app.post('/api/ghost/upload-rps', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.logFile as UploadedFile;
      const tempFilePath = logFile.tempFilePath;
      
      try {
        let logContent: string;
        
        // Process the file based on extension
        if (logFile.name.endsWith('.gz')) {
          const gzippedData = fs.readFileSync(tempFilePath);
          const gunzip = promisify(zlib.gunzip);
          const decompressedData = await gunzip(gzippedData);
          logContent = decompressedData.toString('utf8');
        } 
        else if (logFile.name.endsWith('.log') || logFile.name.endsWith('.txt')) {
          logContent = fs.readFileSync(tempFilePath, 'utf8');
        }
        else {
          return res.status(400).json({ 
            message: 'Unsupported file format. Please upload a .gz, .log, or .txt file' 
          });
        }
        
        // Save the decompressed file
        const decompressedFilePath = path.join('/tmp', `rps_log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active RPS log file path
        activeRPSLogFilePath = decompressedFilePath;
        
        return res.status(200).json({ 
          message: 'RPS log file uploaded and processed successfully',
          lines: logContent.split('\n').length
        });
      } catch (error) {
        console.error('Error processing RPS log file:', error);
        return res.status(500).json({ message: 'Error processing RPS log file' });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in RPS file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // API endpoint to upload and process ghostmon log files
  app.post('/api/upload/ghostmon', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.file as UploadedFile;
      const tempFilePath = logFile.tempFilePath;
      
      try {
        let logContent: string;
        
        // Process the file based on extension
        if (logFile.name.endsWith('.gz')) {
          const gzippedData = fs.readFileSync(tempFilePath);
          const gunzip = promisify(zlib.gunzip);
          const decompressedData = await gunzip(gzippedData);
          logContent = decompressedData.toString('utf8');
        } 
        else if (logFile.name.endsWith('.log') || logFile.name.endsWith('.txt')) {
          logContent = fs.readFileSync(tempFilePath, 'utf8');
        }
        else {
          return res.status(400).json({ 
            message: 'Unsupported file format. Please upload a .gz, .log, or .txt file' 
          });
        }
        
        // Save the decompressed file
        const decompressedFilePath = path.join('/tmp', `ghostmon_log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active ghostmon log file path
        activeGhostmonLogFilePath = decompressedFilePath;
        
        // Return the content directly for client-side processing
        return res.status(200).send(logContent);
      } catch (error) {
        console.error('Error processing ghostmon log file:', error);
        return res.status(500).json({ message: 'Error processing ghostmon log file' });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in ghostmon file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // API endpoints to serve ARL RPM and RPS log file content
  app.get('/api/arl/rpm', (req, res) => {
    try {
      const logContent = fs.readFileSync(activeARLRPMLogFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading ARL RPM log file:', error);
      res.status(500).send('Error reading ARL RPM log file');
    }
  });
  
  app.get('/api/arl/rps', (req, res) => {
    try {
      const logContent = fs.readFileSync(activeARLRPSLogFilePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (error) {
      console.error('Error reading ARL RPS log file:', error);
      res.status(500).send('Error reading ARL RPS log file');
    }
  });

  // --- REPORT SHARING API ENDPOINTS ---

  // Create a new report share
  app.post('/api/reports', async (req, res) => {
    try {
      const { shareId, data, description } = req.body;
      
      // Validate request data
      if (!shareId || !data) {
        return res.status(400).json({ message: 'Missing required fields: shareId and data' });
      }

      // Initialize storage if needed
      await storage.init();

      // Save the report data to file storage
      const report = await storage.createReport({
        shareId,
        data,
        description: description || null,
        userId: null // User authentication not implemented yet
      });

      return res.status(201).json({
        message: 'Report saved successfully',
        shareId: report.shareId,
        id: report.id
      });
    } catch (error) {
      console.error('Error saving report:', error);
      return res.status(500).json({ message: 'Error saving report data' });
    }
  });

  // Get a shared report by its shareId
  app.get('/api/reports/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      
      // Initialize storage if needed
      await storage.init();

      // Retrieve the report from file storage
      const report = await storage.getReport(shareId);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error retrieving report:', error);
      return res.status(500).json({ message: 'Error retrieving report data' });
    }
  });

  // Delete a shared report
  app.delete('/api/reports/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      
      // Initialize storage if needed
      await storage.init();

      // Delete the report from file storage
      const success = await storage.deleteReport(shareId);
      
      if (!success) {
        return res.status(404).json({ message: 'Report not found or already deleted' });
      }
      
      return res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      return res.status(500).json({ message: 'Error deleting report' });
    }
  });

  // API endpoint to upload ARL RPM log files
  app.post('/api/arl/upload-rpm', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.file as UploadedFile;
      const tempFilePath = logFile.tempFilePath;
      
      try {
        // Process plain text file
        const logContent = fs.readFileSync(tempFilePath, 'utf8');
        
        // Save the file
        const decompressedFilePath = path.join('/tmp', `arl_rpm_log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active ARL RPM log file path
        activeARLRPMLogFilePath = decompressedFilePath;
        
        // Return the content directly for client-side processing
        return res.status(200).send(logContent);
      } catch (error) {
        console.error('Error processing ARL RPM log file:', error);
        return res.status(500).json({ message: 'Error processing ARL RPM log file' });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in ARL RPM file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // API endpoint to upload ARL RPS log files
  app.post('/api/arl/upload-rps', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
      }

      const logFile = req.files.file as UploadedFile;
      const tempFilePath = logFile.tempFilePath;
      
      try {
        // Process plain text file
        const logContent = fs.readFileSync(tempFilePath, 'utf8');
        
        // Save the file
        const decompressedFilePath = path.join('/tmp', `arl_rps_log_${Date.now()}.txt`);
        fs.writeFileSync(decompressedFilePath, logContent);
        
        // Update the active ARL RPS log file path
        activeARLRPSLogFilePath = decompressedFilePath;
        
        // Return the content directly for client-side processing
        return res.status(200).send(logContent);
      } catch (error) {
        console.error('Error processing ARL RPS log file:', error);
        return res.status(500).json({ message: 'Error processing ARL RPS log file' });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error in ARL RPS file upload handler:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Export report as standalone HTML
  app.post('/api/export-report', async (req, res) => {
    try {
      const reportData = req.body;
      
      // Optimize data for export
      const optimizedData = {
        ...reportData,
        // Limit detailed entries to reduce size
        detailedEntries: (reportData.detailedEntries || []).slice(0, 100),
        // Sample data points if too many
        data: reportData.data.length > 1000
          ? reportData.data.filter((_: any, i: number) => i % Math.ceil(reportData.data.length / 1000) === 0)
          : reportData.data,
        // Add export timestamp
        exportedAt: new Date().toISOString()
      };
      
      // Read the standalone template
      const templatePath = path.join(process.cwd(), 'server-performance-app-standalone.html');
      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Inject the optimized data
      template = template.replace(
        '/* REPORT_DATA */',
        `window.REPORT_DATA = ${JSON.stringify(optimizedData)};`
      );
      
      // Set headers for HTML download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=performance-report-${new Date().toISOString().split('T')[0]}.html`);
      
      // Send the HTML file
      res.send(template);
    } catch (error) {
      console.error('Error generating report export:', error);
      res.status(500).json({ message: 'Failed to generate report export' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
