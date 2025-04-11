import { useState, useEffect } from 'react';
import { parseLogFile } from '../utils/logParser';
import { LogData, OverloadEvent, Metrics } from '../types';
import { apiRequest } from '@/lib/queryClient';

const useLogData = () => {
  const [data, setData] = useState<LogData[]>([]);
  const [overloadEvents, setOverloadEvents] = useState<OverloadEvent[]>([]);
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
      
      const { parsedData, events, metrics, uniqueArls } = await parseLogFile(logContent);
      
      setData(parsedData);
      setOverloadEvents(events);
      setMetrics(metrics);
      setUniqueArls(uniqueArls);
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
    metrics,
    uniqueArls,
    loading,
    refreshData: fetchLogData
  };
};

export default useLogData;
