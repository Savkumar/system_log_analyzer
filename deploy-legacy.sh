#!/bin/bash

# Server Performance Analysis App Deployment Script for Legacy Node.js
# This script builds the app on Replit and creates a deployment package

echo "🚀 Starting legacy deployment process..."

# Create deployment directory
OUTPUT_DIR="./dist-legacy"
mkdir -p $OUTPUT_DIR
echo "✅ Created output directory $OUTPUT_DIR"

# Build the application on Replit
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Application built successfully"

# Copy the simplified server
echo "📋 Copying simplified server..."
cp server-simple.js $OUTPUT_DIR/server.js

# Copy the built application
echo "📋 Copying built application..."
cp -r dist $OUTPUT_DIR/

# Create a package.json file for the simplified server
echo "📝 Creating simplified package.json..."
cat > $OUTPUT_DIR/package.json << 'EOL'
{
  "name": "server-performance-analysis",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "express-fileupload": "^1.2.1"
  }
}
EOL

# Create a simple README with installation instructions
echo "📝 Creating README with instructions..."
cat > $OUTPUT_DIR/README.md << 'EOL'
# Server Performance Analysis App

## Installation Instructions

1. Install Node.js if not already installed (app works with Node.js 8.x+):
   ```
   sudo apt update
   sudo apt install nodejs npm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Access the application:
   Open your browser and navigate to http://your-server-ip:5000

## Running as a Service

To keep the application running after logout, create a systemd service:

1. Create a service file:
   ```
   sudo nano /etc/systemd/system/server-performance-app.service
   ```

2. Add the following content (adjust paths as needed):
   ```
   [Unit]
   Description=Server Performance Analysis App
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/app
   ExecStart=/usr/bin/node /path/to/app/server.js
   Restart=on-failure
   Environment=PORT=5000

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```
   sudo systemctl enable server-performance-app
   sudo systemctl start server-performance-app
   ```
EOL

# Create a ZIP archive for easy transfer
echo "📦 Creating deployment ZIP archive..."
cd $OUTPUT_DIR
zip -r ../server-performance-app.zip .
cd ..

echo "✨ Legacy deployment package created successfully!"
echo ""
echo "You can deploy the application to your Ubuntu server by:"
echo ""
echo "1. Transfer the ZIP file: scp ./server-performance-app.zip user@your-server:/path/to/deploy/"
echo "2. SSH into your server: ssh user@your-server"
echo "3. Extract the ZIP file: cd /path/to/deploy && unzip server-performance-app.zip"
echo "4. Install dependencies: npm install"
echo "5. Start the application: npm start"
echo ""
echo "For detailed instructions, see the README.md file in the deployment package."