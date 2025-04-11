import { Dispatch, SetStateAction, useEffect, useState } from 'react';
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
  // State to track the detected trigger type (CPU, FLIT, Memory, or Requests)
  const [triggerType, setTriggerType] = useState<'cpu' | 'flits' | 'mem' | 'reqs'>('cpu');
  const [triggerTypeName, setTriggerTypeName] = useState<string>('CPU Trigger %');
  
  // Detect the trigger type based on overload events
  useEffect(() => {
    if (!overloadEvents || overloadEvents.length === 0) return;
    
    // Count occurrences of each trigger type
    const triggerCounts = {
      'cpu': 0,
      'flits': 0,
      'mem': 0,
      'reqs': 0
    };
    
    // Check for rule names and trigger_by fields in overload events
    overloadEvents.forEach(event => {
      const rule = event.rule?.toLowerCase() || '';
      
      if (rule.includes('cpu') || rule.includes('processor')) triggerCounts.cpu++;
      else if (rule.includes('flit')) triggerCounts.flits++;
      else if (rule.includes('mem')) triggerCounts.mem++;
      else if (rule.includes('req') || rule.includes('hit')) triggerCounts.reqs++;
    });
    
    // Find the most common trigger type
    let maxCount = 0;
    let detectedType: 'cpu' | 'flits' | 'mem' | 'reqs' = 'cpu'; // Default to CPU if we can't determine
    
    for (const [type, count] of Object.entries(triggerCounts)) {
      if (count > maxCount) {
        maxCount = count;
        detectedType = type as 'cpu' | 'flits' | 'mem' | 'reqs';
      }
    }
    
    // If no clear trigger type is found by rules, check the arlid field
    if (maxCount === 0) {
      const arlCounts: Record<string, number> = {};
      
      // Count occurrences of each ARL ID
      overloadEvents.forEach(event => {
        if (event.arlid) {
          const arlKey = `arl-${event.arlid}`;
          arlCounts[arlKey] = (arlCounts[arlKey] || 0) + 1;
        }
      });
      
      // If most events have the same ARL ID, it might be a FLIT-related trigger
      const arlEntries = Object.entries(arlCounts);
      if (arlEntries.length > 0) {
        // Sort by count descending
        arlEntries.sort((a, b) => b[1] - a[1]);
        
        // If the most common ARL ID occurs in more than 50% of events, assume it's FLIT
        if (arlEntries[0][1] > overloadEvents.length * 0.5) {
          detectedType = 'flits';
        }
      }
    }
    
    // Set the detected trigger type
    setTriggerType(detectedType);
    
    // Set user-friendly trigger type name
    let displayName = 'CPU Trigger %';
    if (detectedType === 'flits') displayName = 'FLIT Trigger %';
    else if (detectedType === 'mem') displayName = 'Memory Trigger %';
    else if (detectedType === 'reqs') displayName = 'Request Trigger %';
    
    setTriggerTypeName(displayName);
    
    console.log('System Resources Timeline - Detected trigger type:', detectedType, displayName);
  }, [overloadEvents]);
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
              <span className="text-sm">{triggerTypeName}</span>
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
        
        {/* CPU Usage Chart */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">1. CPU Usage - {triggerTypeName} vs Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={formatTimestamp}
                />
                <YAxis 
                  domain={[0, 110]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                {/* Add horizontal threshold line at 100% */}
                <ReferenceLine y={100} stroke="#999999" strokeDasharray="3 3" label={{ value: '100%', position: 'right' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'cpu_all') return [`${value}%`, 'CPU Usage'];
                    if (name === 'triggered_by_cpu') return [`${value.toFixed(1)}%`, triggerTypeName];
                    return [value, name];
                  }}
                  labelFormatter={(value: number) => {
                    const nearbyEvent = overloadEvents.find(e => Math.abs(e.timestamp - value) < 0.5);
                    if (nearbyEvent) {
                      return `Time: ${formatTimestamp(value)} - Overload Event! ARL: ${nearbyEvent.arlid || 'Unknown'}`;
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
                  dataKey="triggered_by_cpu" 
                  stroke="#ff8800" 
                  name={triggerTypeName} 
                  dot={false}
                  activeDot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Flit Percentage Chart */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">2. Flit Percentage - {triggerTypeName} vs Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={formatTimestamp}
                />
                <YAxis 
                  domain={[0, 110]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                {/* Add horizontal threshold line at 100% */}
                <ReferenceLine y={100} stroke="#999999" strokeDasharray="3 3" label={{ value: '100%', position: 'right' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'flit') return [`${value}%`, 'Flit Percentage'];
                    if (name === 'triggered_by_cpu') return [`${value.toFixed(1)}%`, triggerTypeName];
                    return [value, name];
                  }}
                  labelFormatter={(value: number) => {
                    const nearbyEvent = overloadEvents.find(e => Math.abs(e.timestamp - value) < 0.5);
                    if (nearbyEvent) {
                      return `Time: ${formatTimestamp(value)} - Overload Event! ARL: ${nearbyEvent.arlid || 'Unknown'}`;
                    }
                    return `Time: ${formatTimestamp(value)}`;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="flit" 
                  stroke="#0000ff" 
                  strokeWidth={2}
                  name="Flit Percentage" 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="triggered_by_cpu" 
                  stroke="#ff8800" 
                  name={triggerTypeName} 
                  dot={false}
                  activeDot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Manager Cycle Chart */}
        <div>
          <h3 className="text-md font-medium mb-2">3. Manager Cycle (ms) - {triggerTypeName} vs Time</h3>
          <div className="h-64">
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
                  yAxisId="left"
                  domain={['auto', 'auto']} 
                  label={{ value: 'Cycle Time (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 110]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: triggerTypeName, angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                />
                {/* Add horizontal threshold line at 100% for CPU Trigger */}
                <ReferenceLine y={100} stroke="#999999" strokeDasharray="3 3" label={{ value: '100%', position: 'left' }} yAxisId="right" />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'avg_manager_cycle') return [`${value.toFixed(2)} ms`, 'Avg Manager Cycle'];
                    if (name === 'triggered_by_cpu') return [`${value.toFixed(1)}%`, triggerTypeName];
                    return [value, name];
                  }}
                  labelFormatter={(value: number) => {
                    const nearbyEvent = overloadEvents.find(e => Math.abs(e.timestamp - value) < 0.5);
                    if (nearbyEvent) {
                      return `Time: ${formatTimestamp(value)} - Overload Event! ARL: ${nearbyEvent.arlid || 'Unknown'}`;
                    }
                    return `Time: ${formatTimestamp(value)}`;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avg_manager_cycle" 
                  stroke="#00aa00" 
                  strokeWidth={2}
                  name="Avg Manager Cycle" 
                  dot={false}
                  yAxisId="left"
                />
                <Line 
                  type="monotone" 
                  dataKey="triggered_by_cpu" 
                  stroke="#ff8800" 
                  name={triggerTypeName} 
                  dot={false}
                  activeDot={true}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemResourcesChart;