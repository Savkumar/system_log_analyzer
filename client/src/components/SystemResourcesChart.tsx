import { Dispatch, SetStateAction } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LogData, OverloadEvent } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface SystemResourcesChartProps {
  data: LogData[];
  overloadEvents: OverloadEvent[];
  showRange: 'all' | '1h';
  setShowRange: Dispatch<SetStateAction<'all' | '1h'>>;
}

const SystemResourcesChart = ({ 
  data, 
  overloadEvents, 
  showRange, 
  setShowRange 
}: SystemResourcesChartProps) => {
  // Filter data for 1h view if selected
  const displayData = showRange === '1h' && data.length > 0
    ? data.slice(-Math.min(60, data.length)) // Last 60 data points or less
    : data;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-line-chart-line mr-2 text-primary"></i>
        System Resources Timeline
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
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-[#00aa00] rounded-full mr-2"></span>
              <span className="text-sm">Manager Cycle (ms)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-[#ff8800] rounded-full mr-2"></span>
              <span className="text-sm">CPU Trigger</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '1h' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('1h')}
            >
              1h
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('all')}
            >
              All
            </button>
          </div>
        </div>
        
        <div className="h-80">
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
                  if (name === 'avg_manager_cycle') return [`${value.toFixed(2)} ms`, 'Avg Manager Cycle'];
                  if (name === 'triggered_by_cpu') return [`${value.toFixed(1)}%`, 'CPU Trigger'];
                  return [value, name];
                }}
                labelFormatter={(value: number) => {
                  // Find if there's an overload event near this timestamp
                  const nearbyEvent = overloadEvents.find(e => Math.abs(e.timestamp - value) < 0.5);
                  
                  if (nearbyEvent) {
                    return `Time: ${formatTimestamp(value)} - Overload Event! CPU Trigger: ${nearbyEvent.triggered_by_cpu.toFixed(1)}%, ARL: ${nearbyEvent.arlid || 'Unknown'}`;
                  }
                  
                  return `Time: ${formatTimestamp(value)}`;
                }}
              />
              <Legend />
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
                name="Flit Percentage" 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="avg_manager_cycle" 
                stroke="#00aa00" 
                name="Avg Manager Cycle" 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="triggered_by_cpu" 
                stroke="#ff8800" 
                name="CPU Trigger %" 
                dot={(dataPoint) => dataPoint.triggered_by_cpu > 0}
              />
              
              {/* Add reference lines for overload events with ARL ID labels */}
              {overloadEvents.map((event, index) => (
                <ReferenceLine 
                  key={index} 
                  x={event.timestamp} 
                  stroke="#ff8800" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `ARL ${event.arlid || 'Unknown'}`, 
                    position: 'top', 
                    fill: '#ff8800',
                    fontSize: 10
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default SystemResourcesChart;
