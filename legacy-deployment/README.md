# Server Performance Analysis - Legacy Deployment

This is a special legacy-compatible version of the Server Performance Analysis tool designed to work with older Node.js environments (specifically v8.10.0).

## Files Included

- `server-legacy.js` - The minimal Node.js server compatible with Node.js 8.x
- `server-performance-app-standalone.html` - The standalone HTML application
- `legacy-package.json` - Simplified package.json with compatible dependencies

## Installation Instructions

1. **Prepare your environment**
   ```bash
   # Create a directory for the application
   mkdir -p /path/to/app
   cd /path/to/app
   
   # Copy all files to this directory
   # (server-legacy.js, server-performance-app-standalone.html, legacy-package.json)
   ```

2. **Rename package.json**
   ```bash
   mv legacy-package.json package.json
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   npm start
   # or directly
   node server-legacy.js
   ```

5. **Access the application**
   - Open your browser and navigate to http://your-server-ip:5000

## Running as a Service

To keep the application running after logout, create a systemd service:

1. **Create a service file**
   ```bash
   sudo nano /etc/systemd/system/server-performance-app.service
   ```

2. **Add the following content** (adjust paths as needed)
   ```
   [Unit]
   Description=Server Performance Analysis App
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/app
   ExecStart=/usr/bin/node /path/to/app/server-legacy.js
   Restart=on-failure
   Environment=PORT=5000

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service**
   ```bash
   sudo systemctl enable server-performance-app
   sudo systemctl start server-performance-app
   ```

4. **Check service status**
   ```bash
   sudo systemctl status server-performance-app
   ```

## Troubleshooting

If you encounter any issues:

1. **Check Node.js version**
   ```bash
   node -v
   # Should work with v8.10.0 or higher
   ```

2. **Verify the script can run**
   ```bash
   node -c server-legacy.js
   # No output means syntax is valid
   ```

3. **Check for port conflicts**
   ```bash
   sudo netstat -tulpn | grep 5000
   # If port 5000 is in use, change PORT in server-legacy.js
   ```

4. **View logs when running as a service**
   ```bash
   sudo journalctl -u server-performance-app
   ```