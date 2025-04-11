import { GhostmonLogEntry, GhostmonMetrics } from '../types';

/**
 * Parse ghostmon log data
 * Expected format: [DATE TIME LEVEL FILE:LINE METHOD[KEY] dnsp_key=X flyteload=N hits=N suspendflag=N suspendlevel=N
 * Example: [04-10 20:14:24.419 I    write_dnsp.cpp:2453 read_shm[S] dnsp_key=Sflyteload=24953936hits=704.324516suspendflag=0suspendlevel=0
 */
export const parseGhostmonLog = (logContent: string): GhostmonLogEntry[] => {
  const lines = logContent.split('\n');
  const entries: GhostmonLogEntry[] = [];
  
  for (const line of lines) {
    // Skip empty lines or comments
    if (!line.trim() || line.startsWith('#')) {
      continue;
    }
    
    try {
      // Check if it's a valid log entry (starts with a timestamp in brackets)
      if (!line.startsWith('[')) {
        continue;
      }
      
      // Extract the date and time from the log entry
      const dateTimeMatch = line.match(/\[([\d-]+)\s+([\d:.]+)/);
      if (!dateTimeMatch) {
        continue;
      }
      
      const dateStr = dateTimeMatch[1]; // e.g., "04-10"
      const timeStr = dateTimeMatch[2]; // e.g., "20:14:24.419"
      
      // Create a timestamp
      const now = new Date();
      const year = now.getFullYear();
      const [month, day] = dateStr.split('-').map(Number);
      const [hours, minutes, secondsWithMs] = timeStr.split(':').map(val => parseFloat(val));
      const seconds = Math.floor(secondsWithMs);
      
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      const timestamp = Math.floor(date.getTime() / 1000);
      const formattedTime = date.toLocaleString();
      
      // Initialize entry with defaults
      const entry: GhostmonLogEntry = {
        timestamp,
        formattedTime,
        dnsp_key: '',
        flyteload: 0,
        hits: 0,
        suspendflag: 0,
        suspendlevel: 0
      };
      
      // Extract all key-value pairs from the log line
      if (line.includes('dnsp_key=')) {
        const keyValuePart = line.substring(line.indexOf('dnsp_key='));
        
        // Find the dnsp_key value (S or W)
        const dnspMatch = keyValuePart.match(/dnsp_key=([SW])/);
        if (dnspMatch) {
          entry.dnsp_key = dnspMatch[1];
        }
        
        // Extract flyteload
        const flyteloadMatch = keyValuePart.match(/flyteload=(\d+)/);
        if (flyteloadMatch) {
          entry.flyteload = parseInt(flyteloadMatch[1], 10);
        }
        
        // Extract hits
        const hitsMatch = keyValuePart.match(/hits=([\d.]+)/);
        if (hitsMatch) {
          entry.hits = parseFloat(hitsMatch[1]);
        }
        
        // Extract suspendflag
        const suspendFlagMatch = keyValuePart.match(/suspendflag=(\d+)/);
        if (suspendFlagMatch) {
          entry.suspendflag = parseInt(suspendFlagMatch[1], 10);
        }
        
        // Extract suspendlevel
        const suspendLevelMatch = keyValuePart.match(/suspendlevel=(\d+)/);
        if (suspendLevelMatch) {
          entry.suspendlevel = parseInt(suspendLevelMatch[1], 10);
        }
        
        entries.push(entry);
      }
    } catch (error) {
      console.error('Error parsing line:', line, error);
    }
  }
  
  // Sort by timestamp
  return entries.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Filter ghostmon log entries by dnsp_key
 */
export const filterByDnspKey = (entries: GhostmonLogEntry[], key: 'S' | 'W' | 'all'): GhostmonLogEntry[] => {
  if (key === 'all') {
    return entries;
  }
  
  return entries.filter(entry => entry.dnsp_key === key);
};

/**
 * Calculate metrics from ghostmon log data
 */
export const calculateGhostmonMetrics = (entries: GhostmonLogEntry[]): GhostmonMetrics => {
  if (entries.length === 0) {
    return {
      maxFlyteload: 0,
      avgFlyteload: 0,
      maxHits: 0,
      avgHits: 0,
      maxSuspendlevel: 0,
      timespan: 'N/A'
    };
  }
  
  // Calculate max and avg values
  const maxFlyteload = Math.max(...entries.map(e => e.flyteload));
  const avgFlyteload = entries.reduce((sum, e) => sum + e.flyteload, 0) / entries.length;
  
  const maxHits = Math.max(...entries.map(e => e.hits));
  const avgHits = entries.reduce((sum, e) => sum + e.hits, 0) / entries.length;
  
  const maxSuspendlevel = Math.max(...entries.map(e => e.suspendlevel));
  
  // Calculate timespan
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  const timespan = `${firstEntry.formattedTime} to ${lastEntry.formattedTime}`;
  
  return {
    maxFlyteload,
    avgFlyteload,
    maxHits,
    avgHits,
    maxSuspendlevel,
    timespan
  };
};
