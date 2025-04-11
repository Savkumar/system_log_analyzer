import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LogData, TimeRange } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface CPUFlitChartProps {
  data: LogData[];
  showRange: TimeRange;
}

const CPUFlitChart = ({ data, showRange }: CPUFlitChartProps) => {
  // Filter data according to the selected time range
  const getDataForRange = (range: TimeRange, data: LogData[]) => {
    if (data.length === 0) return data;
    
    switch (range) {
      case '5s':
        return data.slice(-Math.min(5, data.length));
      case '10s':
        return data.slice(-Math.min(10, data.length));
      case '15s':
        return data.slice(-Math.min(15, data.length));
      case '30s':
        return data.slice(-Math.min(30, data.length));
      case '1m':
        return data.slice(-Math.min(60, data.length));
      case '10m':
        return data.slice(-Math.min(600, data.length));
      case '30m':
        return data.slice(-Math.min(1800, data.length));
      case '1h':
        return data.slice(-Math.min(3600, data.length));
      case 'all':
      default:
        return data;
    }
  };
  
  // Filter data for the selected time range
  const displayData = getDataForRange(showRange, data);
    
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-bar-chart-grouped-line mr-2 text-primary"></i>
        CPU Usage vs Flit Percentage
      </h2>
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-[#ff0000] rounded-full mr-2"></span>
              <span className="text-sm">CPU Usage</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-[#0000ff] rounded-full mr-2"></span>
              <span className="text-sm">Flit Percentage</span>
            </div>
          </div>
        </div>
        
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatTimestamp}
                label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 110]} 
                ticks={[0, 20, 40, 60, 80, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              />
              {/* Add horizontal threshold line at 100% */}
              <ReferenceLine y={100} stroke="#999999" strokeDasharray="3 3" label={{ value: '100%', position: 'right' }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'cpu_all') return [`${value}%`, 'CPU Usage'];
                  if (name === 'flit') return [`${value}%`, 'Flit Percentage'];
                  return [value, name];
                }}
                labelFormatter={(value: number) => `Time: ${formatTimestamp(value)}`}
              />
              <Line 
                type="monotone" 
                dataKey="cpu_all" 
                stroke="#ff0000" 
                strokeWidth={2}
                name="CPU Usage" 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="flit" 
                stroke="#0000ff" 
                strokeWidth={2}
                name="Flit Percentage" 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default CPUFlitChart;
