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
      
      // Parse detailed entries for the tabular view
      const detailedData = await parseDetailedLogEntries(logContent);
      
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
