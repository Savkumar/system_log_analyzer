import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ARLData, TimeRange, TrafficMetrics, RPMData, RPSData } from '../types';
import { filterByTimeRange } from '../utils/timeRangeFilter';
import { formatTimestamp } from '../utils/logParser';
import CombinedTrafficAnalysis from './CombinedTrafficAnalysis';
import TrafficAnalysisSummary from './TrafficAnalysisSummary';

interface ARLTrafficAnalysisProps {
  arlRPMData: ARLData[];
  arlRPSData: ARLData[];
  overallRPMData: RPMData[];
  overallRPSData: RPSData[];
  metrics: TrafficMetrics & {
    onAnalysisUpdate?: (analysis: {
      correlation: number;
      patternSimilarity: number;
      anomalies: { timestamp: number; value: number; deviation: number }[];
    }) => void;
  };
  loading: boolean;
  error: string | null;
}

const ARLTrafficAnalysis = ({
  arlRPMData,
  arlRPSData,
  overallRPMData,
  overallRPSData,
  metrics,
  loading,
  error
}: ARLTrafficAnalysisProps) => {
  const [selectedARLId, setSelectedARLId] = useState<number | null>(null);
  const [showRange, setShowRange] = useState<TimeRange>('all');
  
  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };
  
  const getAvailableARLIds = () => {
    const arlIdsRPM = arlRPMData.map(data => data.arlId);
    const arlIdsRPS = arlRPSData.map(data => data.arlId);
    
    // Combine and remove duplicates
    return Array.from(new Set([...arlIdsRPM, ...arlIdsRPS])).sort((a, b) => a - b);
  };
  
  const getARLData = (arlId: number, type: 'rpm' | 'rps'): { timestamp: number; requestCount: number; formattedTime: string }[] => {
    if (type === 'rpm') {
      const data = arlRPMData.find(data => data.arlId === arlId);
      return data ? data.requests : [];
    } else {
      const data = arlRPSData.find(data => data.arlId === arlId);
      return data ? data.requests : [];
    }
  };
  
  const getDataForRange = (range: TimeRange, data: { timestamp: number; requestCount: number; formattedTime: string }[]): typeof data => {
    return filterByTimeRange(data, range);
  };

  // Select the first ARL ID if none is selected
  if (selectedARLId === null && arlRPMData.length > 0) {
    setSelectedARLId(arlRPMData[0].arlId);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Processing ARL traffic data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <i className="ri-error-warning-line text-xl mr-2"></i>
          <h3 className="font-semibold">Error Processing ARL Traffic Data</h3>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {getAvailableARLIds().length > 0 ? (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Select ARL ID for Analysis</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {getAvailableARLIds().map(arlId => (
                <button
                  key={arlId}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedARLId === arlId 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedARLId(arlId)}
                >
                  ARL {arlId}
                </button>
              ))}
            </div>
            
            <div className="mb-2">
              <h3 className="text-lg font-medium mb-2">Select Time Range</h3>
              <div className="flex flex-wrap gap-2">
                {['5s', '10s', '15s', '30s', '1m', '10m', '30m', '1h', 'all'].map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      showRange === range 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setShowRange(range as TimeRange)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {selectedARLId !== null && (
            <div>
              {/* Traffic Analysis Summary */}
              <div className="mb-8">
                <TrafficAnalysisSummary
                  arlData={getDataForRange(showRange, getARLData(selectedARLId, 'rpm'))}
                  overallData={filterByTimeRange(overallRPMData, showRange)}
                  arlId={selectedARLId}
                  onAnalysisComplete={metrics.onAnalysisUpdate}
                />
              </div>

              {/* Combined Traffic Analysis */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3">Combined Traffic Analysis - ARL {selectedARLId}</h3>
                <CombinedTrafficAnalysis
                  overallRPMData={filterByTimeRange(overallRPMData, showRange)}
                  overallRPSData={filterByTimeRange(overallRPSData, showRange)}
                  arlRPMData={getDataForRange(showRange, getARLData(selectedARLId, 'rpm'))}
                  arlRPSData={getDataForRange(showRange, getARLData(selectedARLId, 'rps'))}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
          <h3 className="text-lg font-medium mb-2">No ARL Traffic Data Available</h3>
          <p className="text-gray-600">Upload ARL RPM and RPS log files to visualize the traffic patterns.</p>
        </div>
      )}
    </div>
  );
};

export default ARLTrafficAnalysis;