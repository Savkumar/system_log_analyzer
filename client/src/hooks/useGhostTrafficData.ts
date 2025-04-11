import { useState } from 'react';
import { TrafficMetrics, RPMData, RPSData } from '../types';
import { parseRPMData, parseRPSData, calculateTrafficMetrics } from '../utils/ghostTrafficParser';

interface GhostTrafficDataReturn {
  rpmData: RPMData[];
  rpsData: RPSData[];
  metrics: TrafficMetrics;
  loading: boolean;
  error: string | null;
  uploadTrafficData: (rpmLogContent: string, rpsLogContent: string) => void;
}

export function useGhostTrafficData(): GhostTrafficDataReturn {
  const [rpmData, setRpmData] = useState<RPMData[]>([]);
  const [rpsData, setRpsData] = useState<RPSData[]>([]);
  const [metrics, setMetrics] = useState<TrafficMetrics>({
    maxRPM: 0,
    avgRPM: 0,
    totalRequests: 0,
    maxRPS: 0,
    avgRPS: 0,
    timespan: 'N/A'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadTrafficData = (rpmLogContent: string, rpsLogContent: string) => {
    try {
      setLoading(true);
      setError(null);

      // Parse the RPM data
      const parsedRpmData = parseRPMData(rpmLogContent);
      setRpmData(parsedRpmData);

      // Parse the RPS data
      const parsedRpsData = parseRPSData(rpsLogContent);
      setRpsData(parsedRpsData);

      // Calculate metrics
      const trafficMetrics = calculateTrafficMetrics(parsedRpmData, parsedRpsData);
      setMetrics(trafficMetrics);

      setLoading(false);
    } catch (err) {
      setError(`Error parsing traffic data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return {
    rpmData,
    rpsData,
    metrics,
    loading,
    error,
    uploadTrafficData
  };
}