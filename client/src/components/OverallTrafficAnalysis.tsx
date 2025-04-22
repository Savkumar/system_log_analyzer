import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RPMData, RPSData, TrafficMetrics, TimeRange } from '../types';
import { filterByTimeRange } from '../utils/timeRangeFilter';
import { formatTimestamp } from '../utils/logParser';

interface OverallTrafficAnalysisProps {
  rpmData: RPMData[];
  rpsData: RPSData[];
  metrics: TrafficMetrics;
  loading: boolean;
  error: string | null;
}

const OverallTrafficAnalysis = ({
  rpmData,
  rpsData,
  metrics,
  loading,
  error
}: OverallTrafficAnalysisProps) => {
  const [showRange, setShowRange] = useState<TimeRange>('all');

  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };


  const getDataForRange = (data: typeof rpmData | typeof rpsData): typeof data => {
    return filterByTimeRange(data, showRange);
  };

  const getTrafficAnalysisContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Processing traffic data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="ri-error-warning-line text-xl mr-2"></i>
            <h3 className="font-semibold">Error Processing Traffic Data</h3>
          </div>
          <p>{error}</p>
        </div>
      );
    }

    if (rpmData.length === 0 || rpsData.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
          <h3 className="text-lg font-medium mb-2">No Traffic Data Available</h3>
          <p className="text-gray-600">Upload RPM and RPS log files to visualize Ghost Traffic.</p>
        </div>
      );
    }

    const filteredRPMData = getDataForRange(rpmData);
    const filteredRPSData = getDataForRange(rpsData);

    return (
      <div>
        {/* Traffic metrics summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-blue-700 mb-1">Max RPM</h3>
            <p className="text-2xl font-bold">{metrics.maxRPM.toLocaleString()}</p>
            <p className="text-sm text-blue-600 mt-1">Peak requests per minute</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-green-700 mb-1">Avg RPM</h3>
            <p className="text-2xl font-bold">{metrics.avgRPM.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">Average requests per minute</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-purple-700 mb-1">Max RPS</h3>
            <p className="text-2xl font-bold">{metrics.maxRPS.toLocaleString()}</p>
            <p className="text-sm text-purple-600 mt-1">Peak requests per second</p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-indigo-700 mb-1">Avg RPS</h3>
            <p className="text-2xl font-bold">{metrics.avgRPS.toLocaleString()}</p>
            <p className="text-sm text-indigo-600 mt-1">Average requests per second</p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-amber-700 mb-1">Total Requests</h3>
            <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
            <p className="text-sm text-amber-600 mt-1">During {metrics.timespan}</p>
          </div>
        </div>

        {/* Time Range Selection */}
        <div className="mb-6">
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

        {/* RPM Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Overall Traffic - Requests Per Minute (RPM)</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={filteredRPMData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Requests']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requestCount" 
                    name="Requests Per Minute" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RPS Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Overall Traffic - Requests Per Second (RPS)</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={filteredRPSData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Requests']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requestCount" 
                    name="Requests Per Second" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overall Traffic Pattern</h2>
      
      <div className="mb-8">
        {getTrafficAnalysisContent()}
      </div>
    </div>
  );
};

export default OverallTrafficAnalysis;