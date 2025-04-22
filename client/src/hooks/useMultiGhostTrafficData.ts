import { useState } from 'react';
import { CategoryTrafficData, MultiGhostTrafficData, TrafficMetrics, RPMData, RPSData } from '../types';
import { parseRPMData, parseRPSData, calculateTrafficMetrics } from '../utils/ghostTrafficParser';

interface MultiGhostTrafficDataReturn {
  trafficData: MultiGhostTrafficData;
  metrics: {
    arl: TrafficMetrics;
    overall: TrafficMetrics;
    withoutArl: TrafficMetrics;
  };
  loading: boolean;
  error: string | null;
  uploadTrafficData: (data: {
    arl: { rpm: string; rps: string };
    overall: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => void;
}

const emptyTrafficData: CategoryTrafficData = {
  rpm: [],
  rps: []
};

const emptyMetrics: TrafficMetrics = {
  maxRPM: 0,
  avgRPM: 0,
  totalRequests: 0,
  maxRPS: 0,
  avgRPS: 0,
  timespan: 'N/A'
};

export function useMultiGhostTrafficData(): MultiGhostTrafficDataReturn {
  const [trafficData, setTrafficData] = useState<MultiGhostTrafficData>({
    arl: emptyTrafficData,
    overall: emptyTrafficData,
    withoutArl: emptyTrafficData
  });

  const [metrics, setMetrics] = useState<{
    arl: TrafficMetrics;
    overall: TrafficMetrics;
    withoutArl: TrafficMetrics;
  }>({
    arl: emptyMetrics,
    overall: emptyMetrics,
    withoutArl: emptyMetrics
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processCategory = (
    rpmContent: string,
    rpsContent: string
  ): CategoryTrafficData => {
    const parsedRpmData = parseRPMData(rpmContent);
    const parsedRpsData = parseRPSData(rpsContent);

    return {
      rpm: parsedRpmData,
      rps: parsedRpsData
    };
  };

  const uploadTrafficData = async (data: {
    arl: { rpm: string; rps: string };
    overall: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => {
    try {
      setLoading(true);
      setError(null);

      const newTrafficData: MultiGhostTrafficData = {
        arl: processCategory(data.arl.rpm, data.arl.rps),
        overall: processCategory(data.overall.rpm, data.overall.rps),
        withoutArl: processCategory(data.withoutArl.rpm, data.withoutArl.rps)
      };

      const newMetrics = {
        arl: calculateTrafficMetrics(newTrafficData.arl.rpm, newTrafficData.arl.rps),
        overall: calculateTrafficMetrics(newTrafficData.overall.rpm, newTrafficData.overall.rps),
        withoutArl: calculateTrafficMetrics(newTrafficData.withoutArl.rpm, newTrafficData.withoutArl.rps)
      };

      setTrafficData(newTrafficData);
      setMetrics(newMetrics);
      setLoading(false);
    } catch (err) {
      setError(`Error processing traffic data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return {
    trafficData,
    metrics,
    loading,
    error,
    uploadTrafficData
  };
}