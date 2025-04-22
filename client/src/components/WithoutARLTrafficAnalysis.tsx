import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RPMData, RPSData, TimeRange } from '../types';
import { filterByTimeRange } from '../utils/timeRangeFilter';
import { formatTimestamp } from '../utils/logParser';

interface WithoutARLTrafficAnalysisProps {
  rpmData: RPMData[];
  rpsData: RPSData[];
  loading: boolean;
  error: string | null;
}

const WithoutARLTrafficAnalysis = ({
  rpmData,
  rpsData,
  loading,
  error
}: WithoutARLTrafficAnalysisProps) => {
  const [showRange, setShowRange] = useState<TimeRange>('all');

  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };

  const getDataForRange = (range: TimeRange, data: RPMData[] | RPSData[]): typeof data => {
    return filterByTimeRange(data, range);
  };

  const getTrafficContent = () => {
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
          <p className="text-gray-600">Upload traffic log files to visualize patterns without ARL traffic.</p>
        </div>
      );
    }

    const filteredRPMData = getDataForRange(showRange, rpmData);
    const filteredRPSData = getDataForRange(showRange, rpsData);

    return (
      <div>
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
          <h3 className="text-lg font-medium mb-3">Requests Per Minute (Without ARL)</h3>
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
          <h3 className="text-lg font-medium mb-3">Requests Per Second (Without ARL)</h3>
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
      <h2 className="text-2xl font-bold mb-6">Traffic Pattern without ARLs</h2>
      {getTrafficContent()}
    </div>
  );
};

export default WithoutARLTrafficAnalysis;