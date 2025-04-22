import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RPMData, RPSData } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface CombinedTrafficAnalysisProps {
  overallRPMData: RPMData[];
  overallRPSData: RPSData[];
  arlRPMData: RPMData[];
  arlRPSData: RPSData[];
  loading: boolean;
  error: string | null;
}

const CombinedTrafficAnalysis = ({
  overallRPMData,
  overallRPSData,
  arlRPMData,
  arlRPSData,
  loading,
  error
}: CombinedTrafficAnalysisProps) => {
  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };

  // Create combined and sorted datasets
  const combinedRPMData = [...overallRPMData, ...arlRPMData]
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc: { timestamp: number; overall?: number; arl?: number }[], curr) => {
      const existing = acc.find(item => item.timestamp === curr.timestamp);
      if (existing) {
        if (overallRPMData.includes(curr)) {
          existing.overall = curr.requestCount;
        } else {
          existing.arl = curr.requestCount;
        }
      } else {
        acc.push({
          timestamp: curr.timestamp,
          ...(overallRPMData.includes(curr) ? { overall: curr.requestCount } : { arl: curr.requestCount })
        });
      }
      return acc;
    }, []);

  const combinedRPSData = [...overallRPSData, ...arlRPSData]
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc: { timestamp: number; overall?: number; arl?: number }[], curr) => {
      const existing = acc.find(item => item.timestamp === curr.timestamp);
      if (existing) {
        if (overallRPSData.includes(curr)) {
          existing.overall = curr.requestCount;
        } else {
          existing.arl = curr.requestCount;
        }
      } else {
        acc.push({
          timestamp: curr.timestamp,
          ...(overallRPSData.includes(curr) ? { overall: curr.requestCount } : { arl: curr.requestCount })
        });
      }
      return acc;
    }, []);

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

  return (
    <div className="space-y-6">
      {/* RPM Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h4 className="text-lg font-medium mb-2">Combined RPM Analysis</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedRPMData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }}
              />
              {/* Left Y-axis for ARL RPM */}
              <YAxis
                yAxisId="arl"
                orientation="left"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: 'ARL RPM', angle: -90, position: 'insideLeft' }}
              />
              {/* Right Y-axis for Overall RPM */}
              <YAxis
                yAxisId="overall"
                orientation="right"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: 'Overall RPM', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const val = value.toLocaleString();
                  return [val, name];
                }}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line
                yAxisId="overall"
                type="monotone"
                dataKey="overall"
                name="Overall RPM"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
              <Line
                yAxisId="arl"
                type="monotone"
                dataKey="arl"
                name="ARL RPM"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RPS Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-lg font-medium mb-2">Combined RPS Analysis</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedRPSData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }}
              />
              {/* Left Y-axis for ARL RPS */}
              <YAxis
                yAxisId="arl"
                orientation="left"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: 'ARL RPS', angle: -90, position: 'insideLeft' }}
              />
              {/* Right Y-axis for Overall RPS */}
              <YAxis
                yAxisId="overall"
                orientation="right"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => value.toLocaleString()}
                label={{ value: 'Overall RPS', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const val = value.toLocaleString();
                  return [val, name];
                }}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line
                yAxisId="overall"
                type="monotone"
                dataKey="overall"
                name="Overall RPS"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
              <Line
                yAxisId="arl"
                type="monotone"
                dataKey="arl"
                name="ARL RPS"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CombinedTrafficAnalysis;