#!/usr/bin/env node

/**
 * Server Performance Analysis App Packaging Script
 * 
 * This script creates a standalone executable for the Server Performance Analysis application
 * using pkg. It builds the application first, then packages it into a self-contained binary.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const pkgConfig = {
  name: 'server-performance-app',
  target: 'node18-linux-x64',
  outputPath: './dist-pkg',
  entryPoint: './dist/index.js',
  assets: ['./dist/**/*']
};

// Create temp pkg.json file for packaging
const createTempPkgConfig = () => {
  const tempConfig = {
    name: "server-performance-analysis",
    bin: pkgConfig.entryPoint,
    pkg: {
      assets: pkgConfig.assets,
      targets: [pkgConfig.target]
    }
  };
  
  if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp');
  }
  
  fs.writeFileSync('./tmp/pkg.json', JSON.stringify(tempConfig, null, 2));
  console.log('✅ Created temporary pkg configuration');
};

// Ensure output directory exists
const ensureOutputDir = () => {
  if (!fs.existsSync(pkgConfig.outputPath)) {
    fs.mkdirSync(pkgConfig.outputPath, { recursive: true });
  }
  console.log(`✅ Ensured output directory ${pkgConfig.outputPath} exists`);
};

// Build the application
const buildApp = () => {
  return new Promise((resolve, reject) => {
    console.log('🏗️ Building application...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Build error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Build stderr: ${stderr}`);
      }
      console.log('✅ Application built successfully');
      console.log(stdout);
      resolve();
    });
  });
};

// Package the application using pkg
const packageApp = () => {
  return new Promise((resolve, reject) => {
    console.log('📦 Packaging application...');
    
    const outputFile = path.join(pkgConfig.outputPath, pkgConfig.name);
    const cmd = `npx pkg ./tmp/pkg.json --target ${pkgConfig.target} --output ${outputFile}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Packaging error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Packaging stderr: ${stderr}`);
      }
      console.log('✅ Application packaged successfully');
      console.log(stdout);
      console.log(`📁 Binary created at: ${outputFile}`);
      resolve();
    });
  });
};

// Clean up temporary files
const cleanup = () => {
  if (fs.existsSync('./tmp/pkg.json')) {
    fs.unlinkSync('./tmp/pkg.json');
  }
  if (fs.existsSync('./tmp') && fs.readdirSync('./tmp').length === 0) {
    fs.rmdirSync('./tmp');
  }
  console.log('🧹 Cleaned up temporary files');
};

// Main execution
async function main() {
  try {
    console.log('🚀 Starting deployment process...');
    ensureOutputDir();
    createTempPkgConfig();
    await buildApp();
    await packageApp();
    cleanup();
    console.log('✨ Deployment completed successfully!');
    console.log(`\nYou can deploy the binary (${pkgConfig.name}) from the ${pkgConfig.outputPath} directory to your Ubuntu server.`);
    console.log('\nDeployment instructions:');
    console.log('1. Transfer the binary to your server: scp ./dist-pkg/server-performance-app user@your-server:/path/to/deploy/');
    console.log('2. SSH into your server: ssh user@your-server');
    console.log('3. Make the binary executable: chmod +x /path/to/deploy/server-performance-app');
    console.log('4. Run the application: /path/to/deploy/server-performance-app');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    cleanup();
    process.exit(1);
  }
}

main();