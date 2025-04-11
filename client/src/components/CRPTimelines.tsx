import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DetailedLogEntry, TimeRange } from '../types';

interface CRPTimelinesProps {
  data: DetailedLogEntry[];
  showRange: TimeRange;
  setShowRange: React.Dispatch<React.SetStateAction<TimeRange>>;
}

const CRPTimelines = ({ data, showRange, setShowRange }: CRPTimelinesProps) => {
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('separate');
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  // Filter data based on time range
  const getDataForRange = (range: TimeRange, data: DetailedLogEntry[]): DetailedLogEntry[] => {
    if (range === 'all') return data;
    
    const now = Math.floor(Date.now() / 1000);
    const rangeMap: Record<TimeRange, number> = {
      '5s': 5,
      '10s': 10,
      '15s': 15,
      '30s': 30,
      '1m': 60,
      '10m': 600,
      '30m': 1800,
      '1h': 3600,
      'all': 0
    };
    
    const seconds = rangeMap[range];
    if (seconds === 0) return data;
    
    const cutoffTime = now - seconds;
    return data.filter(item => item.timestamp >= cutoffTime);
  };
  
  const filteredData = getDataForRange(showRange, data);
  
  // Only include data points that have non-zero CRP values
  // Try to get real CRP data first
  const [usingSyntheticData, setUsingSyntheticData] = useState(false);
  const [crpData, setCrpData] = useState<DetailedLogEntry[]>([]);
  
  useEffect(() => {
    // Look for real CRP data first
    const realCrpData = filteredData.filter(entry => 
      entry.crp_deny_pct > 0 || 
      entry.crp_trigger_pct > 0 ||
      entry.crp_metrics_cpu > 0 ||
      entry.crp_metrics_reqs > 0
    );
    
    console.log('Real CRP Data available:', realCrpData.length > 0);
    
    if (realCrpData.length > 0) {
      // We have real data
      setCrpData(realCrpData);
      setUsingSyntheticData(false);
    } else if (filteredData.length > 0) {
      // Generate synthetic CRP data based on the CPU and other metrics if real data isn't available
      const syntheticData = filteredData.map(entry => {
        return {
          ...entry,
          // Use CPU value as a base for synthetic CRP metrics to make it realistic
          crp_deny_pct: Math.max(0, Math.min(100, entry.cpu_all * 0.8)), // 80% of CPU
          crp_trigger_pct: Math.max(0, Math.min(100, entry.cpu_all * 0.9)), // 90% of CPU
          crp_metrics_cpu: Math.max(0, entry.cpu_all - 5), // Slightly less than actual CPU
          crp_metrics_reqs: Math.floor(entry.flit * 10) // Some arbitrary calculation based on flit
        };
      });
      
      setCrpData(syntheticData);
      setUsingSyntheticData(true);
      console.log('Using synthetic CRP data for demonstration');
    } else {
      // No data at all
      setCrpData([]);
    }
  }, [filteredData]);
  
  const renderCombinedChart = () => (
    <div className="h-96 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={crpData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTime}
            tick={{ fontSize: 12 }} 
          />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => {
              return [
                `${Number(value).toLocaleString()}${name.includes('Pct') ? '%' : ''}`, 
                name.replace('crp_', '').replace('_', ' ').replace('Pct', ' %')
              ];
            }}
            labelFormatter={formatTime}
          />
          <Legend />
          <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="crp_deny_pct" 
            name="Deny %" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="crp_trigger_pct" 
            name="Trigger %" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="crp_metrics_cpu" 
            name="CPU" 
            stroke="#ffc658" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="crp_metrics_reqs" 
            name="Requests" 
            stroke="#ff8042" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  
  const renderSeparateCharts = () => (
    <div>
      {/* CRP Deny Percentage Chart */}
      <div className="h-64 mb-6">
        <h3 className="text-lg font-medium mb-2">CRP Deny Percentage vs Time</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={crpData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }} 
              />
              <YAxis domain={[0, 'dataMax']} />
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString()}%`, 'Deny Percentage']}
                labelFormatter={formatTime}
              />
              <Legend />
              <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="crp_deny_pct" 
                name="Deny %" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* CRP Trigger Percentage Chart */}
      <div className="h-64 mb-6">
        <h3 className="text-lg font-medium mb-2">CRP Trigger Percentage vs Time</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={crpData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }} 
              />
              <YAxis domain={[0, 'dataMax']} />
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString()}%`, 'Trigger Percentage']}
                labelFormatter={formatTime}
              />
              <Legend />
              <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="crp_trigger_pct" 
                name="Trigger %" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* CRP CPU Chart */}
      <div className="h-64 mb-6">
        <h3 className="text-lg font-medium mb-2">CRP CPU vs Time</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={crpData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }} 
              />
              <YAxis domain={[0, 'dataMax']} />
              <Tooltip 
                formatter={(value: any) => [Number(value).toLocaleString(), 'CPU']}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="crp_metrics_cpu" 
                name="CPU" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* CRP Requests Chart */}
      <div className="h-64 mb-6">
        <h3 className="text-lg font-medium mb-2">CRP Requests vs Time</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={crpData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }} 
              />
              <YAxis domain={[0, 'dataMax']} />
              <Tooltip 
                formatter={(value: any) => [Number(value).toLocaleString(), 'Requests']}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="crp_metrics_reqs" 
                name="Requests" 
                stroke="#ff8042" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">CRP Timelines</h2>
          {usingSyntheticData && (
            <div className="text-xs text-amber-600 font-medium mt-1">
              * Using derived data for demonstration. Upload a log file with CRP events for actual metrics.
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'combined' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('combined')}
            >
              Combined View
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'separate' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('separate')}
            >
              Separate Views
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Time Range</h3>
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
      
      {crpData.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No CRP data available for the selected time range.</p>
        </div>
      ) : (
        viewMode === 'combined' ? renderCombinedChart() : renderSeparateCharts()
      )}
    </div>
  );
};

export default CRPTimelines;