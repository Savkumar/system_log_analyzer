import { useState } from 'react';
import { ARLData } from '../types';
import { parseARLRPMData, parseARLRPSData } from '../utils/arlTrafficParser';

interface ARLTrafficDataReturn {
  arlRPMData: ARLData[];
  arlRPSData: ARLData[];
  loading: boolean;
  error: string | null;
  uploadARLRPMData: (logContent: string) => void;
  uploadARLRPSData: (logContent: string) => void;
}

export function useARLTrafficData(): ARLTrafficDataReturn {
  const [arlRPMData, setARLRPMData] = useState<ARLData[]>([]);
  const [arlRPSData, setARLRPSData] = useState<ARLData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadARLRPMData = (logContent: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const parsedData = parseARLRPMData(logContent);
      setARLRPMData(parsedData);
      
      setLoading(false);
    } catch (err) {
      setError(`Error parsing ARL RPM data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  const uploadARLRPSData = (logContent: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const parsedData = parseARLRPSData(logContent);
      setARLRPSData(parsedData);
      
      setLoading(false);
    } catch (err) {
      setError(`Error parsing ARL RPS data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return {
    arlRPMData,
    arlRPSData,
    loading,
    error,
    uploadARLRPMData,
    uploadARLRPSData
  };
}