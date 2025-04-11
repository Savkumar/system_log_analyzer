import { LogData, OverloadEvent, Metrics } from '../types';

// Format timestamp for display
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

// Parse log file content
export const parseLogFile = async (logContent: string): Promise<{
  parsedData: LogData[],
  events: OverloadEvent[],
  metrics: Metrics,
  uniqueArls: number[]
}> => {
  const lines = logContent.split('\n');
  const parsedData: LogData[] = [];
  const events: OverloadEvent[] = [];
  
  lines.forEach(line => {
    // Process Robust stats line
    if (line.includes('Robust - stats:')) {
      const timestampMatch = line.match(/^(\d+\.\d+)/);
      const cpuMatch = line.match(/CPU: all (\d+)%/);
      const flitMatch = line.match(/flit (\d+)%/);
      const cycleMatch = line.match(/AVG manager cycle (\d+)us/);
      
      if (timestampMatch && cpuMatch) {
        const timestamp = parseFloat(timestampMatch[1]);
        const cpu = parseInt(cpuMatch[1]);
        const flit = flitMatch ? parseInt(flitMatch[1]) : 0;
        const cycle = cycleMatch ? parseInt(cycleMatch[1]) / 1000 : 0; // Convert to ms
        
        parsedData.push({
          timestamp,
          cpu_all: cpu,
          flit,
          avg_manager_cycle: cycle,
          triggered_by_cpu: 0,
          arlid: 0
        });
      }
    }
    
    // Process OverloadManager processMainLoop line
    if (line.includes('OverloadManager::processMainLoop()') && line.includes('triggered by cpu:')) {
      const timestampMatch = line.match(/^(\d+\.\d+)/);
      const cpuTriggerMatch = line.match(/triggered by cpu:([0-9.]+)/);
      
      if (timestampMatch && cpuTriggerMatch) {
        const timestamp = parseFloat(timestampMatch[1]);
        const cpuTriggerValue = parseFloat(cpuTriggerMatch[1]) * 100; // Scale to percentage
        
        // Look for the related addCandidateTarget line to get the ARLID
        const arlidLine = lines.find(l => 
          l.includes('addCandidateTarget()') && 
          Math.abs(parseFloat(l.match(/^(\d+\.\d+)/)?.[1] || '0') - timestamp) < 1
        );
        
        let arlid = null;
        let rule = null;
        
        if (arlidLine) {
          const arlidMatch = arlidLine.match(/arlid:(\d+)/);
          const ruleMatch = arlidLine.match(/rule:'([^']+)'/);
          
          if (arlidMatch) arlid = parseInt(arlidMatch[1]);
          if (ruleMatch) rule = ruleMatch[1];
        }
        
        // Find closest regular data point to get system state
        let closestDataPoint = null;
        let minTimeDiff = Infinity;
        
        for (const dataPoint of parsedData) {
          const timeDiff = Math.abs(dataPoint.timestamp - timestamp);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestDataPoint = dataPoint;
          }
        }
        
        // Create overload event with system state data
        const event: OverloadEvent = {
          timestamp,
          triggered_by_cpu: cpuTriggerValue,
          arlid,
          rule,
          cpu_all: closestDataPoint ? closestDataPoint.cpu_all : 0,
          flit: closestDataPoint ? closestDataPoint.flit : 0,
          avg_manager_cycle: closestDataPoint ? closestDataPoint.avg_manager_cycle : 0
        };
        
        events.push(event);
        
        // Add a data point for the event
        parsedData.push({
          timestamp,
          cpu_all: closestDataPoint ? closestDataPoint.cpu_all : 0,
          flit: closestDataPoint ? closestDataPoint.flit : 0,
          avg_manager_cycle: closestDataPoint ? closestDataPoint.avg_manager_cycle : 0,
          triggered_by_cpu: cpuTriggerValue,
          arlid: arlid || 0
        });
      }
    }
  });
  
  // Sort data by timestamp
  parsedData.sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate metrics
  const cpuValues = parsedData.filter(d => d.cpu_all > 0).map(d => d.cpu_all);
  const flitValues = parsedData.filter(d => d.flit > 0).map(d => d.flit);
  const cycleValues = parsedData.filter(d => d.avg_manager_cycle > 0).map(d => d.avg_manager_cycle);
  
  const metrics: Metrics = {
    cpu: {
      min: cpuValues.length ? Math.min(...cpuValues) : 0,
      max: cpuValues.length ? Math.max(...cpuValues) : 0,
      avg: cpuValues.length ? cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length : 0
    },
    flit: {
      min: flitValues.length ? Math.min(...flitValues) : 0,
      max: flitValues.length ? Math.max(...flitValues) : 0,
      avg: flitValues.length ? flitValues.reduce((a, b) => a + b, 0) / flitValues.length : 0
    },
    cycle: {
      min: cycleValues.length ? Math.min(...cycleValues) : 0,
      max: cycleValues.length ? Math.max(...cycleValues) : 0,
      avg: cycleValues.length ? cycleValues.reduce((a, b) => a + b, 0) / cycleValues.length : 0
    }
  };
  
  // Find unique ARLs affected by overload events
  const uniqueArlSet = new Set(events.filter(e => e.arlid).map(e => e.arlid as number));
  const uniqueArls = Array.from(uniqueArlSet);
  
  return { parsedData, events, metrics, uniqueArls };
};
