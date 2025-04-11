import { Dispatch, SetStateAction } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LogData, OverloadEvent, TimeRange } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface SystemResourcesChartProps {
  data: LogData[];
  overloadEvents: OverloadEvent[];
  showRange: TimeRange;
  setShowRange: Dispatch<SetStateAction<TimeRange>>;
}

const SystemResourcesChart = ({ 
  data, 
  overloadEvents, 
  showRange, 
  setShowRange 
}: SystemResourcesChartProps) => {
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
          <div className="flex flex-wrap gap-2">
            {/* Short time ranges */}
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '5s' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('5s')}
            >
              5s
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '10s' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('10s')}
            >
              10s
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '15s' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('15s')}
            >
              15s
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '30s' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('30s')}
            >
              30s
            </button>
            
            {/* Medium time ranges */}
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '1m' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('1m')}
            >
              1m
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '10m' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('10m')}
            >
              10m
            </button>
            <button 
              className={`text-sm px-2 py-1 border border-gray-300 rounded ${showRange === '30m' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setShowRange('30m')}
            >
              30m
            </button>
            
            {/* Long time ranges */}
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
                dot={false}
                activeDot={true}
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
