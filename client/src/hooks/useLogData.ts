import { useState, useEffect } from 'react';
import { parseLogFile, parseDetailedLogEntries } from '../utils/logParser';
import { LogData, OverloadEvent, Metrics, DetailedLogEntry } from '../types';
import { apiRequest } from '@/lib/queryClient';

const useLogData = () => {
  const [data, setData] = useState<LogData[]>([]);
  const [overloadEvents, setOverloadEvents] = useState<OverloadEvent[]>([]);
  const [detailedEntries, setDetailedEntries] = useState<DetailedLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<Metrics>({ 
    cpu: { min: 0, max: 0, avg: 0 }, 
    flit: { min: 0, max: 0, avg: 0 }, 
    cycle: { min: 0, max: 0, avg: 0 } 
  });
  const [uniqueArls, setUniqueArls] = useState<number[]>([]);

  const fetchLogData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/logs', undefined);
      const logContent = await response.text();
      
      // Parse standard log data
      const { parsedData, events, metrics, uniqueArls: initialUniqueArls } = await parseLogFile(logContent);
      
      // Debug logging for troubleshooting
      console.log('useLogData - Parsed overload events:', events.length, events.slice(0, 3));
      
      // Check for FLIT-specific patterns or triggers
      const flitEvents = events.filter(event => {
        const rule = event.rule?.toLowerCase() || '';
        return rule.includes('flit');
      });
      console.log('useLogData - FLIT-specific events:', flitEvents.length, flitEvents.slice(0, 3));
      
      // Parse detailed entries for the tabular view
      const detailedData = await parseDetailedLogEntries(logContent);
      
      // Find detailed entries with CRP data (these are the real events)
      const crpEntries = detailedData.filter(entry => entry.crp_rule !== 'N/A');
      console.log('useLogData - Detailed entries with CRP data:', crpEntries.length);
      
      // If we have detailed CRP entries but no events, create events from the CRP entries
      // This ensures we show events in the Overload Events section
      let allEvents = [...events];
      let finalUniqueArls = [...initialUniqueArls];
      
      if (crpEntries.length > 0 && events.length === 0) {
        console.log('useLogData - Creating events from CRP entries');
        
        // Convert CRP entries to overload events
        const crpEvents = crpEntries.map(entry => {
          const event: OverloadEvent = {
            timestamp: entry.timestamp,
            triggered_by_cpu: entry.crp_trigger_pct,
            arlid: entry.crp_arlid,
            rule: entry.crp_rule,
            cpu_all: entry.cpu_all,
            flit: entry.flit,
            avg_manager_cycle: entry.avg_mgr_cycle
          };
          return event;
        });
        
        console.log('useLogData - Created', crpEvents.length, 'events from CRP entries');
        
        // Add to our events
        allEvents = [...events, ...crpEvents];
        
        // Update unique ARLs
        const uniqueArlsSet = new Set([
          ...initialUniqueArls,
          ...crpEvents
            .filter(e => e.arlid !== null)
            .map(e => e.arlid as number)
        ]);
        finalUniqueArls = Array.from(uniqueArlsSet);
      }
      
      setData(parsedData);
      setOverloadEvents(allEvents); // Use allEvents instead of events
      setMetrics(metrics);
      setUniqueArls(finalUniqueArls); // Use finalUniqueArls instead of uniqueArls
      setDetailedEntries(detailedData);
    } catch (error) {
      console.error('Error fetching log data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogData();
  }, []);

  return {
    data,
    overloadEvents,
    detailedEntries,
    metrics,
    uniqueArls,
    loading,
    refreshData: fetchLogData
  };
};

export default useLogData;
