import { ARLData } from '../types';

/**
 * Parse ARL request per minute (RPM) data
 * Format: ## ARL ID: 123456 followed by date lines with request counts
 * Example: 10 Apr 21:01 66
 */
export const parseARLRPMData = (logContent: string): ARLData[] => {
  console.log('parseARLRPMData called with content of length:', logContent.length);
  
  const arlDataArray: ARLData[] = [];
  const lines = logContent.split('\n');
  console.log('Number of lines:', lines.length);
  
  let currentArlId: number | null = null;
  let currentRequests: { timestamp: number; requestCount: number; formattedTime: string }[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Sample a few lines for debugging
    if (Math.random() < 0.1) {
      console.log('Sample line:', trimmedLine);
    }
    
    // Skip empty lines and command lines, but not lines with # if they contain "ARL ID"
    if (!trimmedLine || (trimmedLine.startsWith('#') && !trimmedLine.includes('ARL ID'))) {
      continue;
    }
    
    // Check if this is an ARL ID line - more lenient matching for "## ARL ID: 12345" or "ARL ID: 12345"
    const arlIdMatch = trimmedLine.match(/(?:^##\s*)ARL ID:\s*(\d+)/);
    if (arlIdMatch) {
      console.log('Found ARL ID line:', trimmedLine);
      // If we already have a current ARL ID, save it before starting a new one
      if (currentArlId !== null && currentRequests.length > 0) {
        arlDataArray.push({
          arlId: currentArlId,
          requests: [...currentRequests]
        });
        console.log(`Added ARL ID ${currentArlId} with ${currentRequests.length} requests`);
      }
      
      // Start tracking a new ARL ID
      currentArlId = parseInt(arlIdMatch[1], 10);
      console.log('New current ARL ID:', currentArlId);
      currentRequests = [];
      continue;
    }
    
    // Parse the request data line
    // Example format: "10 Apr 21:01 66" (day month time requests)
    const dataMatch = trimmedLine.match(/^(\d+)\s+(\w+)\s+(\d+):(\d+)\s+(\d+)$/);
    if (dataMatch && currentArlId !== null) {
      console.log('Found data line:', trimmedLine);
      const [_, day, month, hour, minute, requestCount] = dataMatch;
      
      // Convert to timestamp
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const now = new Date();
      const year = now.getFullYear();
      const date = new Date(year, monthMap[month], parseInt(day), parseInt(hour), parseInt(minute));
      const timestamp = Math.floor(date.getTime() / 1000);
      
      currentRequests.push({
        timestamp,
        requestCount: parseInt(requestCount),
        formattedTime: `${day} ${month} ${hour}:${minute}`
      });
    }
  }
  
  // Don't forget to add the last ARL ID data if it exists
  if (currentArlId !== null && currentRequests.length > 0) {
    arlDataArray.push({
      arlId: currentArlId,
      requests: [...currentRequests]
    });
  }
  
  return arlDataArray;
};

/**
 * Parse ARL request per second (RPS) data
 * Format: ## ARL ID: 123456 followed by date lines with request counts
 * Example: 10 Apr 21:01:18 3
 */
export const parseARLRPSData = (logContent: string): ARLData[] => {
  console.log('parseARLRPSData called with content of length:', logContent.length);
  
  const arlDataArray: ARLData[] = [];
  const lines = logContent.split('\n');
  console.log('Number of lines in RPS data:', lines.length);
  
  let currentArlId: number | null = null;
  let currentRequests: { timestamp: number; requestCount: number; formattedTime: string }[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Sample a few lines for debugging
    if (Math.random() < 0.05) {
      console.log('RPS Sample line:', trimmedLine);
    }
    
    // Skip empty lines and command lines, but not lines with # if they contain "ARL ID"
    if (!trimmedLine || (trimmedLine.startsWith('#') && !trimmedLine.includes('ARL ID'))) {
      continue;
    }
    
    // Check if this is an ARL ID line - more lenient matching for "## ARL ID: 12345" or "ARL ID: 12345"
    const arlIdMatch = trimmedLine.match(/(?:^##\s*)ARL ID:\s*(\d+)/);
    if (arlIdMatch) {
      console.log('Found ARL ID line in RPS data:', trimmedLine);
      // If we already have a current ARL ID, save it before starting a new one
      if (currentArlId !== null && currentRequests.length > 0) {
        arlDataArray.push({
          arlId: currentArlId,
          requests: [...currentRequests]
        });
        console.log(`Added ARL ID ${currentArlId} with ${currentRequests.length} RPS requests`);
      }
      
      // Start tracking a new ARL ID
      currentArlId = parseInt(arlIdMatch[1], 10);
      console.log('New current ARL ID in RPS data:', currentArlId);
      currentRequests = [];
      continue;
    }
    
    // Parse the request data line
    // Example format: "10 Apr 21:01:18 3" (day month time:second requests)
    const dataMatch = trimmedLine.match(/^(\d+)\s+(\w+)\s+(\d+):(\d+):(\d+)\s+(\d+)$/);
    if (dataMatch && currentArlId !== null) {
      console.log('RPS Found data line:', trimmedLine);
      const [_, day, month, hour, minute, second, requestCount] = dataMatch;
      
      // Convert to timestamp
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const now = new Date();
      const year = now.getFullYear();
      const date = new Date(year, monthMap[month], parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      const timestamp = Math.floor(date.getTime() / 1000);
      
      currentRequests.push({
        timestamp,
        requestCount: parseInt(requestCount),
        formattedTime: `${day} ${month} ${hour}:${minute}:${second}`
      });
    }
  }
  
  // Don't forget to add the last ARL ID data if it exists
  if (currentArlId !== null && currentRequests.length > 0) {
    arlDataArray.push({
      arlId: currentArlId,
      requests: [...currentRequests]
    });
  }
  
  return arlDataArray;
};