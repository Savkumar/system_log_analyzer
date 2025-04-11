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
