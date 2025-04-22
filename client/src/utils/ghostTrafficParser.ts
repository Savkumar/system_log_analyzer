import { RPMData, RPSData, TrafficMetrics } from '../types';

// Helper function to convert month name to number (0-11)
const getMonthNumber = (month: string): number => {
  const months: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  return months[month] || 0;
};

/**
 * Parse requests per minute (RPM) data from ghost traffic log
 */
export const parseRPMData = (logContent: string): RPMData[] => {
  const lines = logContent.split('\n');
  const data: RPMData[] = [];
  
  let currentYear = new Date().getFullYear();
  
  for (const line of lines) {
    // Skip comment lines and empty lines
    if (line.startsWith('#') || !line.trim()) {
      continue;
    }
    
    // Example line format: "10 Apr 21:01 30000"
    const parts = line.trim().split(' ');
    if (parts.length >= 4) {
      const day = parts[0];
      const month = parts[1];
      const timeStr = parts[2]; 
      const requestCount = parseInt(parts[3], 10);
      
      if (!isNaN(requestCount)) {
        // Format: "DD Apr HH:MM"
        const formattedTime = `${day} ${month} ${timeStr}`;
        
        // Create a timestamp for sorting/filtering
        // Using a consistent year for relative timestamps
        // Parse time components
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Create UTC date
        const date = new Date();
        date.setUTCFullYear(currentYear);
        date.setUTCMonth(getMonthNumber(month));
        date.setUTCDate(parseInt(day));
        date.setUTCHours(hours);
        date.setUTCMinutes(minutes);
        date.setUTCSeconds(0);
        
        const timestamp = Math.floor(date.getTime() / 1000);
        
        data.push({
          timestamp,
          requestCount,
          formattedTime
        });
      }
    }
  }
  
  return data.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Parse requests per second (RPS) data from ghost traffic log
 */
export const parseRPSData = (logContent: string): RPSData[] => {
  const lines = logContent.split('\n');
  const data: RPSData[] = [];
  
  let currentYear = new Date().getFullYear();
  
  for (const line of lines) {
    // Skip comment lines and empty lines
    if (line.startsWith('#') || !line.trim()) {
      continue;
    }
    
    // Example line format: "10 Apr 21:01:23 710"
    const parts = line.trim().split(' ');
    if (parts.length >= 4) {
      const day = parts[0];
      const month = parts[1];
      const timeStr = parts[2];
      const requestCount = parseInt(parts[3], 10);
      
      if (!isNaN(requestCount)) {
        // Format: "DD Apr HH:MM:SS"
        const formattedTime = `${day} ${month} ${timeStr}`;
        
        // Create a timestamp for sorting/filtering
        // Using a consistent year for relative timestamps
        // Parse time components
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        
        // Create UTC date
        const date = new Date();
        date.setUTCFullYear(currentYear);
        date.setUTCMonth(getMonthNumber(month));
        date.setUTCDate(parseInt(day));
        date.setUTCHours(hours);
        date.setUTCMinutes(minutes);
        date.setUTCSeconds(seconds);
        
        const timestamp = Math.floor(date.getTime() / 1000);
        
        data.push({
          timestamp,
          requestCount,
          formattedTime
        });
      }
    }
  }
  
  return data.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Calculate traffic metrics from the parsed data
 */
export const calculateTrafficMetrics = (rpmData: RPMData[], rpsData: RPSData[]): TrafficMetrics => {
  // Calculate RPM metrics
  const maxRPM = rpmData.reduce((max, item) => Math.max(max, item.requestCount), 0);
  const totalRPM = rpmData.reduce((sum, item) => sum + item.requestCount, 0);
  const avgRPM = rpmData.length > 0 ? totalRPM / rpmData.length : 0;
  
  // Calculate RPS metrics
  const maxRPS = rpsData.reduce((max, item) => Math.max(max, item.requestCount), 0);
  const totalRPS = rpsData.reduce((sum, item) => sum + item.requestCount, 0);
  const avgRPS = rpsData.length > 0 ? totalRPS / rpsData.length : 0;
  
  // Calculate timespan
  let timespan = "N/A";
  if (rpmData.length > 0) {
    const firstData = rpmData[0];
    const lastData = rpmData[rpmData.length - 1];
    timespan = `${firstData.formattedTime} to ${lastData.formattedTime}`;
  }
  
  return {
    maxRPM,
    avgRPM: Math.round(avgRPM),
    totalRequests: totalRPM,
    maxRPS,
    avgRPS: Math.round(avgRPS),
    timespan
  };
};