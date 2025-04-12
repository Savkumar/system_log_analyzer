/**
 * Simplified Express server for the Server Performance Analysis app
 * Compatible with Node.js 8.x
 * This version has no dependencies on express-fileupload or other modern packages
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - only using basic Express features
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the standalone HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'server-performance-app-standalone.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server Performance Analysis app running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});