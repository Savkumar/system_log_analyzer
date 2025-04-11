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
      const { parsedData, events, metrics, uniqueArls } = await parseLogFile(logContent);
      
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
      console.log('useLogData - Detailed entries with CRP data:', 
        detailedData.filter(entry => entry.crp_rule !== 'N/A').length);
      
      setData(parsedData);
      setOverloadEvents(events);
      setMetrics(metrics);
      setUniqueArls(uniqueArls);
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
