import { GhostmonLogEntry, GhostmonMetrics } from '../types';

/**
 * Parse ghostmon log data
 * Expected format: timestamp dnsp_key=X flyteload=N hits=N suspendflag=N suspendlevel=N [ocp=N] [osp=N]
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
      // Extract timestamp and all key-value pairs
      const parts = line.trim().split(/\s+/);
      
      if (parts.length < 6) {
        continue; // Skip incomplete lines
      }
      
      const timestamp = parseInt(parts[0], 10);
      
      if (isNaN(timestamp)) {
        continue; // Skip invalid timestamps
      }
      
      // Format the timestamp for display
      const date = new Date(timestamp * 1000);
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
      
      // Parse all key-value pairs
      for (let i = 1; i < parts.length; i++) {
        const kvPair = parts[i];
        const [key, value] = kvPair.split('=');
        
        if (!key || !value) continue;
        
        switch (key) {
          case 'dnsp_key':
            entry.dnsp_key = value;
            break;
          case 'flyteload':
            entry.flyteload = parseFloat(value);
            break;
          case 'hits':
            entry.hits = parseInt(value, 10);
            break;
          case 'suspendflag':
            entry.suspendflag = parseInt(value, 10);
            break;
          case 'suspendlevel':
            entry.suspendlevel = parseInt(value, 10);
            break;
          case 'ocp':
            entry.ocp = parseFloat(value);
            break;
          case 'osp':
            entry.osp = parseFloat(value);
            break;
          default:
            // Store any additional fields
            if (!entry.extra) {
              entry.extra = '';
            }
            entry.extra += `${key}=${value} `;
        }
      }
      
      entries.push(entry);
    } catch (error) {
      console.error(`Error parsing line: ${line}`, error);
      // Continue with next line
    }
  }
  
  // Sort by timestamp
  return entries.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Filter ghostmon log entries by dnsp_key
 */
export const filterByDnspKey = (entries: GhostmonLogEntry[], key: 'S' | 'W' | string | null): GhostmonLogEntry[] => {
  if (!key) {
    return entries; // Return all entries if no filter
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