import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogData } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface CPUFlitChartProps {
  data: LogData[];
  showRange: 'all' | '1h';
}

const CPUFlitChart = ({ data, showRange }: CPUFlitChartProps) => {
  // Filter data for 1h view if selected
  const displayData = showRange === '1h' && data.length > 0
    ? data.slice(-Math.min(60, data.length)) // Last 60 data points or less
    : data;
    
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
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              />
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
