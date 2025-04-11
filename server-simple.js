/**
 * Simplified Express server for the Server Performance Analysis app
 * Compatible with older Node.js versions (8.x+)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp')
}));

// Ensure tmp directory exists
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes for log file uploads and processing
app.post('/api/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const logFile = req.files.file;
  const uploadPath = path.join(tmpDir, logFile.name);

  // Move the file to the temporary directory
  logFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Return success response
    res.json({ 
      message: 'File uploaded successfully', 
      filename: logFile.name,
      size: logFile.size 
    });
  });
});

// Basic API routes
app.get('/api/logs', (req, res) => {
  // In a real implementation, this would read and process log files
  // For now, return a sample success response
  res.json({ 
    success: true,
    message: 'Log data processed successfully' 
  });
});

// All remaining requests return the React app, so it can handle routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server Performance Analysis app running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});