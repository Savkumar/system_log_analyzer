# Server Performance Analysis Tool

A comprehensive web application for analyzing server performance metrics, detecting overload events, and visualizing server behavior through interactive charts and detailed tables. This tool helps system administrators and developers monitor server health, identify performance bottlenecks, and troubleshoot issues in real-time.

![Server Performance Analysis Tool](attached_assets/Screenshot%202025-04-11%20at%2009.44.04.jpg)

## Features

- **Real-time Monitoring**: Track CPU usage, memory consumption, and request load in real-time
- **Performance Visualization**: Interactive charts showing system resource utilization over time
- **Overload Event Detection**: Automatically identify and highlight server overload events
- **Request Analysis**: Monitor HTTP/HTTPS accepts and traffic patterns
- **Detailed Logging**: Comprehensive logs with filtering capabilities
- **Traffic Analysis**:
  - Ghost Traffic Analysis (requests per minute/second)
  - ARL (Access Rule List) traffic monitoring
  - Request distribution visualization
- **Advanced Metrics**: CPU flits, manager cycle times, and other performance indicators
- **Ghostmon Integration**: Analysis of Ghostmon logs for deeper insights
- **Executive Summary**: At-a-glance view of system health and performance status
- **Time Range Filtering**: View data across different time ranges (5s, 10s, 15s, 30s, 1m, 10m, 30m, 1h, all)
- **Data Export**: Export analyzed data for reporting or further processing

## Displayed Information

The application displays the following key information:

### Metrics and Summaries
- **Executive Summary**: High-level overview of system performance and health
- **Metrics Summary**: Min/max/avg values for CPU usage, flit rates, and manager cycle times
- **Overload Summary**: Analysis of overload events and affected ARLs

### Charts and Visualizations
- **System Resources Chart**: Interactive visualization of CPU, memory, and request metrics over time
- **CPU Flit Chart**: Specialized chart focusing on CPU flit patterns
- **Ghost Traffic Analysis**: Charts showing requests per minute (RPM) and requests per second (RPS)
- **ARL Traffic Analysis**: Traffic patterns for specific Access Rule Lists

### Tables and Detailed Data
- **Overload Events Table**: Detailed list of overload events with timestamps and triggering conditions
- **Detailed Log Table**: Comprehensive view of all log entries with filtering capabilities
- **Ghost Traffic Tables**: Detailed ghost traffic metrics

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Savankumar1988/CodeReviewTool.git
   cd server-performance-analysis-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the application:
   ```
   npm run build
   ```

## Usage

### Development Mode

Start the development server:
```
npm run dev
```

This will start the application in development mode, serving both the API and client on port 5000.

### Production Mode

Build and start the application in production mode:
```
npm run build
npm run start
```

### Using the Application

1. Open your browser and navigate to `http://localhost:5000`
2. Upload server log files using the file uploader
3. View and analyze the performance data
4. Use the time range controls to zoom in on specific time periods
5. Export data as needed

## File Upload Types

The application supports several types of log files:

- **Server Log Files**: Standard server logs containing CPU, memory, and request metrics
- **Ghostmon Log Files**: Special logs from Ghostmon monitoring system
- **Ghost Traffic Files**: Files containing ghost traffic data (RPM/RPS)
- **ARL Traffic Files**: Files containing ARL-specific traffic information

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Backend**: Express.js, Node.js
- **API**: RESTful API with file upload capabilities
- **Data Processing**: Custom parsers for different log formats
- **State Management**: React Hooks and Context
- **Styling**: Tailwind CSS with custom components
- **UI Framework**: Radix UI components with Shadcn/UI

## Development

### Project Structure

- `/client`: Frontend React application
  - `/src/components`: React components
  - `/src/hooks`: Custom React hooks
  - `/src/utils`: Utility functions and parsers
  - `/src/types`: TypeScript type definitions
- `/server`: Backend Express application
  - `index.ts`: Server entry point
  - `routes.ts`: API route definitions
  - `storage.ts`: File storage utilities
- `/shared`: Shared code between client and server

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run check`: Run TypeScript type checking
- `npm run db:push`: Update database schema (if using Drizzle ORM)

## License

MIT
