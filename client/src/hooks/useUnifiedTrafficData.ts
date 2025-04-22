import { useState } from 'react';
import { 
  RPMData, 
  RPSData, 
  TrafficMetrics, 
  ARLTrafficData,
  MultiGhostTrafficData 
} from '../types';
import { 
  parseRPMData, 
  parseRPSData, 
  calculateTrafficMetrics 
} from '../utils/ghostTrafficParser';
import { parseARLRPMData, parseARLRPSData } from '../utils/arlTrafficParser';

interface UnifiedTrafficDataReturn {
  overallData: {
    rpm: RPMData[];
    rps: RPSData[];
    metrics: TrafficMetrics;
  };
  arlData: {
    data: ARLTrafficData;
    metrics: TrafficMetrics;
  };
  withoutArlData: {
    rpm: RPMData[];
    rps: RPSData[];
    metrics: TrafficMetrics;
  };
  loading: boolean;
  error: string | null;
  uploadTrafficData: (data: {
    overall: { rpm: string; rps: string };
    arl: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => void;
}

const emptyMetrics: TrafficMetrics = {
  maxRPM: 0,
  avgRPM: 0,
  totalRequests: 0,
  maxRPS: 0,
  avgRPS: 0,
  timespan: 'N/A'
};

export function useUnifiedTrafficData(): UnifiedTrafficDataReturn {
  const [overallData, setOverallData] = useState<{ rpm: RPMData[]; rps: RPSData[]; metrics: TrafficMetrics }>({
    rpm: [],
    rps: [],
    metrics: emptyMetrics
  });

  const [arlData, setArlData] = useState<{ data: ARLTrafficData; metrics: TrafficMetrics }>({
    data: { arlRPM: [], arlRPS: [] },
    metrics: emptyMetrics
  });

  const [withoutArlData, setWithoutArlData] = useState<{ rpm: RPMData[]; rps: RPSData[]; metrics: TrafficMetrics }>({
    rpm: [],
    rps: [],
    metrics: emptyMetrics
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadTrafficData = async (data: {
    overall: { rpm: string; rps: string };
    arl: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Process Overall Traffic Data
      const overallRPMData = parseRPMData(data.overall.rpm);
      const overallRPSData = parseRPSData(data.overall.rps);
      const overallMetrics = calculateTrafficMetrics(overallRPMData, overallRPSData);

      // Process ARL Traffic Data
      const arlRPMData = parseARLRPMData(data.arl.rpm);
      const arlRPSData = parseARLRPSData(data.arl.rps);
      const arlMetrics = calculateTrafficMetrics(
        arlRPMData.flatMap(arl => arl.requests),
        arlRPSData.flatMap(arl => arl.requests)
      );

      // Process Without ARL Traffic Data
      const withoutArlRPMData = parseRPMData(data.withoutArl.rpm);
      const withoutArlRPSData = parseRPSData(data.withoutArl.rps);
      const withoutArlMetrics = calculateTrafficMetrics(withoutArlRPMData, withoutArlRPSData);

      // Update all states
      setOverallData({
        rpm: overallRPMData,
        rps: overallRPSData,
        metrics: overallMetrics
      });

      setArlData({
        data: {
          arlRPM: arlRPMData,
          arlRPS: arlRPSData
        },
        metrics: arlMetrics
      });

      setWithoutArlData({
        rpm: withoutArlRPMData,
        rps: withoutArlRPSData,
        metrics: withoutArlMetrics
      });

      setLoading(false);
    } catch (err) {
      setError(`Error processing traffic data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return {
    overallData,
    arlData,
    withoutArlData,
    loading,
    error,
    uploadTrafficData
  };
}