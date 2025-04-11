import { LogData, OverloadEvent, Metrics, DetailedLogEntry } from '../types';

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
    // Check for both CPU and FLIT triggers. Lookout for "triggered by" patterns
    if (line.includes('OverloadManager::processMainLoop()')) {
      const timestampMatch = line.match(/^(\d+\.\d+)/);
      
      // Try to find the trigger type and value
      let triggerType = 'cpu';
      let triggerValue = 0;
      
      // Check for CPU trigger
      const cpuTriggerMatch = line.match(/triggered by cpu:([0-9.]+)/);
      if (cpuTriggerMatch) {
        triggerType = 'cpu';
        triggerValue = parseFloat(cpuTriggerMatch[1]) * 100; // Scale to percentage
      }
      
      // Check for FLIT trigger
      const flitTriggerMatch = line.match(/triggered by flit:([0-9.]+)/);
      if (flitTriggerMatch) {
        triggerType = 'flit';
        triggerValue = parseFloat(flitTriggerMatch[1]) * 100; // Scale to percentage
      }
      
      // Log for debugging
      if (triggerType && triggerValue > 0) {
        console.log(`Detected ${triggerType} trigger: ${triggerValue}%`);
      }
      
      if (timestampMatch && (cpuTriggerMatch || flitTriggerMatch)) {
        const timestamp = parseFloat(timestampMatch[1]);
        const triggerPercentage = triggerValue; // Already scaled to percentage
        
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
          triggered_by_cpu: triggerValue, // Use the dynamic trigger value
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
          triggered_by_cpu: triggerValue, // Use the dynamic trigger value
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
  
  // Debug: Log how many events we detected
  console.log(`[parseLogFile] Detected ${events.length} overload events`);
  if (events.length > 0) {
    console.log(`[parseLogFile] Sample overload event:`, events[0]);
    
    // Get all rules for summary
    const rules = events.map(e => e.rule).filter(Boolean);
    // Convert to array using Array.from for better TS compatibility
    const uniqueRules = Array.from(new Set(rules as string[]));
    console.log(`[parseLogFile] Rules detected:`, uniqueRules);
  }
  
  return { parsedData, events, metrics, uniqueArls };
};

// Parse log file for detailed entries with all the requested fields
export const parseDetailedLogEntries = async (logContent: string): Promise<DetailedLogEntry[]> => {
  const lines = logContent.split('\n');
  const entries: DetailedLogEntry[] = [];
  
  // Process Robust stats lines first to get main data points
  const statsLines = lines.filter(line => line.includes('Robust - stats:'));
  
  statsLines.forEach((line, index) => {
    const timestampMatch = line.match(/^(\d+\.\d+)/);
    if (!timestampMatch) return;
    
    const timestamp = parseFloat(timestampMatch[1]);
    const cpuMatch = line.match(/CPU: all (\d+)%/);
    const flitMatch = line.match(/flit (\d+)%/);
    const cycleMatch = line.match(/AVG manager cycle (\d+)us/);
    const memRssMatch = line.match(/Mem RSS (\d+) KB/);
    const httpAcceptsMatch = line.match(/Accepts: http\/https (\d+)\/(\d+)/);
    
    // Create a base entry with data from the stats line
    const entry: DetailedLogEntry = {
      timestamp: Math.floor(timestamp),
      http_accepts: httpAcceptsMatch ? parseInt(httpAcceptsMatch[1]) : 0,
      https_accepts: httpAcceptsMatch ? parseInt(httpAcceptsMatch[2]) : 0,
      flit: flitMatch ? parseInt(flitMatch[1]) : 0,
      cpu_all: cpuMatch ? parseInt(cpuMatch[1]) : 0,
      mem_rss: memRssMatch ? parseInt(memRssMatch[1]) : 0,
      avg_mgr_cycle: cycleMatch ? parseInt(cycleMatch[1]) / 1000 : 0, // Convert to ms
      crp_rule: 'N/A',
      crp_arlid: null,
      crp_trigger_pct: 0,
      crp_deny_pct: 0,
      crp_metrics_cpu: 0,
      crp_metrics_mem: 0,
      crp_metrics_reqs: 0,
      crp_triggered_by: 'N/A',
      crp_triggered_pct: 0,
      time_difference: 0
    };
    
    // Add to entries
    entries.push(entry);
  });
  
  // Sort entries by timestamp
  entries.sort((a, b) => a.timestamp - b.timestamp);
  
  // Now find all CRP event lines
  const crpEvents: DetailedLogEntry[] = [];
  
  // Process candidate target lines first to get details
  const candidateLines = lines.filter(line => line.includes('addCandidateTarget()'));
  
  // Debug - log if any of the candidates contain a FLIT rule
  const flitRuleLines = candidateLines.filter(line => 
    line.toLowerCase().includes('rule:') && 
    line.toLowerCase().includes('flit')
  );
  console.log(`[parseDetailedLogEntries] Found ${candidateLines.length} candidate lines`);
  console.log(`[parseDetailedLogEntries] Of which ${flitRuleLines.length} contain FLIT rule references`);
  if (flitRuleLines.length > 0) {
    console.log(`[parseDetailedLogEntries] Sample FLIT rule line: ${flitRuleLines[0]}`);
  }
  
  candidateLines.forEach(line => {
    const timestampMatch = line.match(/^(\d+\.\d+)/);
    if (!timestampMatch) return;
    
    const timestamp = parseFloat(timestampMatch[1]);
    const arlidMatch = line.match(/arlid:(\d+)/);
    const ruleMatch = line.match(/rule:'([^']+)'/);
    const triggerPctMatch = line.match(/trigger_pct:([0-9.]+)%/);
    const denyPctMatch = line.match(/deny_pct:([0-9.]+)%/);
    const metricsCpuMatch = line.match(/metrics \(cpu:(\d+)ms/);
    const metricsMemMatch = line.match(/mem:(\d+)KB/);
    const metricsReqsMatch = line.match(/reqs:(\d+)\)/);
    
    // Get the closest standard entry as a base
    let closestEntry = entries[0];
    for (const entry of entries) {
      if (Math.abs(entry.timestamp - Math.floor(timestamp)) < 
          Math.abs(closestEntry.timestamp - Math.floor(timestamp))) {
        closestEntry = entry;
      }
    }
    
    // Create a CRP event entry
    const crpEvent: DetailedLogEntry = {
      ...closestEntry,
      timestamp: Math.floor(timestamp),
      crp_rule: ruleMatch ? ruleMatch[1] : 'N/A',
      crp_arlid: arlidMatch ? parseInt(arlidMatch[1]) : null,
      crp_trigger_pct: triggerPctMatch ? parseFloat(triggerPctMatch[1]) : 0,
      crp_deny_pct: denyPctMatch ? parseFloat(denyPctMatch[1]) : 0,
      crp_metrics_cpu: metricsCpuMatch ? parseInt(metricsCpuMatch[1]) : 0,
      crp_metrics_mem: metricsMemMatch ? parseInt(metricsMemMatch[1]) : 0,
      crp_metrics_reqs: metricsReqsMatch ? parseInt(metricsReqsMatch[1]) : 0,
      crp_triggered_by: 'N/A', // Will be filled in next step
      crp_triggered_pct: 0,     // Will be filled in next step
      time_difference: 0        // Will be calculated at the end
    };
    
    crpEvents.push(crpEvent);
  });
  
  // Process processMainLoop lines to get triggered by information
  // Look for both CPU and FLIT triggers
  const mainLoopLines = lines.filter(line => 
    line.includes('processMainLoop()') && 
    (line.includes('triggered by cpu:') || line.includes('triggered by flit:'))
  );
  
  // Debug logging for our filter
  console.log(`[parseDetailedLogEntries] Found ${mainLoopLines.length} processMainLoop lines`);
  if (mainLoopLines.length > 0) {
    console.log(`[parseDetailedLogEntries] Sample line: ${mainLoopLines[0]}`);
  }
  
  mainLoopLines.forEach(line => {
    const timestampMatch = line.match(/^(\d+\.\d+)/);
    let triggerType = 'unknown';
    let triggerValue = 0;
    
    // Check for CPU trigger
    const cpuTriggerMatch = line.match(/triggered by cpu:([0-9.]+)/);
    if (cpuTriggerMatch) {
      triggerType = 'cpu';
      triggerValue = parseFloat(cpuTriggerMatch[1]);
    }
    
    // Check for FLIT trigger
    const flitTriggerMatch = line.match(/triggered by flit:([0-9.]+)/);
    if (flitTriggerMatch) {
      triggerType = 'flit';
      triggerValue = parseFloat(flitTriggerMatch[1]);
    }
    
    if (timestampMatch && triggerType !== 'unknown') {
      const timestamp = parseFloat(timestampMatch[1]);
      
      // Find the corresponding CRP event (should be very close in time)
      const matchingEvent = crpEvents.find(e => 
        Math.abs(e.timestamp - Math.floor(timestamp)) < 1
      );
      
      // Debug log to see which events we're matching
      console.log(`[parseDetailedLogEntries] Trigger at ${timestamp}: ${triggerType} = ${triggerValue}`);
      console.log(`[parseDetailedLogEntries] Matching event found: ${matchingEvent ? 'yes' : 'no'}`);
      
      if (matchingEvent) {
        matchingEvent.crp_triggered_by = triggerType;
        matchingEvent.crp_triggered_pct = triggerValue * 100; // Scale to percentage
      }
    }
  });
  
  // Merge regular entries with CRP events, giving preference to CRP events
  const merged = [...entries];
  
  crpEvents.forEach(crpEvent => {
    const existingIndex = merged.findIndex(e => e.timestamp === crpEvent.timestamp);
    if (existingIndex >= 0) {
      merged[existingIndex] = crpEvent;
    } else {
      merged.push(crpEvent);
    }
  });
  
  // Sort by timestamp
  merged.sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate time differences between CRP events
  const crpOnlyEvents = merged.filter(e => e.crp_arlid !== null);
  
  crpOnlyEvents.forEach((event, index) => {
    if (index > 0) {
      event.time_difference = event.timestamp - crpOnlyEvents[index - 1].timestamp;
    }
  });
  
  return merged;
};
