#!/bin/bash

# Server Performance Analysis App Deployment Script
# This script builds and packages the application using pkg

echo "🚀 Starting deployment process..."

# Build the application
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Application built successfully"

# Ensure output directory exists
OUTPUT_DIR="./dist-pkg"
mkdir -p $OUTPUT_DIR
echo "✅ Ensured output directory $OUTPUT_DIR exists"

# Package the application using pkg
echo "📦 Packaging application..."
npx pkg pkg-config.json --output $OUTPUT_DIR/server-performance-app

if [ $? -ne 0 ]; then
  echo "❌ Packaging failed"
  exit 1
fi

echo "✅ Application packaged successfully"
echo "📁 Binary created at: $OUTPUT_DIR/server-performance-app"

echo "✨ Deployment completed successfully!"
echo ""
echo "You can deploy the binary (server-performance-app) from the $OUTPUT_DIR directory to your Ubuntu server."
echo ""
echo "Deployment instructions:"
echo "1. Transfer the binary to your server: scp ./dist-pkg/server-performance-app user@your-server:/path/to/deploy/"
echo "2. SSH into your server: ssh user@your-server"
echo "3. Make the binary executable: chmod +x /path/to/deploy/server-performance-app"
echo "4. Run the application: /path/to/deploy/server-performance-app"