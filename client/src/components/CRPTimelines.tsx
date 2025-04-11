import { useState } from 'react';
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
  
  // Format timestamps for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  // Filter data based on time range selection
  const getFilteredData = () => {
    if (!data || data.length === 0) return [];
    if (showRange === 'all') return data;
    
    const now = data[data.length - 1].timestamp;
    const timeRangeMap: Record<TimeRange, number> = {
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
    
    const seconds = timeRangeMap[showRange];
    if (seconds === 0) return data;
    
    const cutoffTime = now - seconds;
    return data.filter(entry => entry.timestamp >= cutoffTime);
  };
  
  const filteredData = getFilteredData();
  
  // Check if we even have data to work with
  if (filteredData.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">CRP Timelines</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No data available for the selected time range.</p>
        </div>
      </div>
    );
  }
  
  // Process to find CRP events for display
  // We want all entries - when crp_rule is not N/A, that's a CRP event
  const crpEvents = filteredData.filter(entry => entry.crp_rule && entry.crp_rule !== 'N/A');
  
  // Determine the primary trigger type from CRP events
  let primaryTriggerType = 'cpu'; // Default to CPU if we can't determine
  
  // Check for specific trigger types in CRP events
  if (crpEvents.length > 0) {
    // Count occurrences of each trigger type
    const triggerCounts = {
      'cpu': 0,
      'flits': 0,
      'mem': 0,
      'reqs': 0
    };
    
    // Loop through all CRP events and count each trigger type
    crpEvents.forEach(event => {
      const triggeredBy = event.crp_triggered_by?.toLowerCase() || '';
      
      // Look for trigger keywords in the triggered_by field
      if (triggeredBy.includes('cpu')) triggerCounts.cpu++;
      else if (triggeredBy.includes('flit')) triggerCounts.flits++;
      else if (triggeredBy.includes('mem')) triggerCounts.mem++;
      else if (triggeredBy.includes('req')) triggerCounts.reqs++;
      
      // For debug only - log each entry's trigger
      if (triggeredBy !== 'n/a' && triggeredBy !== '') {
        console.log('Found trigger in event:', event.crp_rule, triggeredBy);
      }
    });
    
    // Also check the full dataset for any clear trigger indicators in crp_rule fields
    filteredData.forEach(entry => {
      const rule = entry.crp_rule?.toLowerCase() || '';
      
      if (rule.includes('cpu')) triggerCounts.cpu++;
      else if (rule.includes('flit')) triggerCounts.flits++;
      else if (rule.includes('mem')) triggerCounts.mem++;
      else if (rule.includes('req')) triggerCounts.reqs++;
      
      if (rule !== 'n/a' && rule !== '') {
        console.log('Found rule hint:', rule);
      }
    });
    
    // Find the most common trigger type
    let maxCount = 0;
    for (const [type, count] of Object.entries(triggerCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryTriggerType = type;
      }
    }
    
    // If we still don't have a trigger type (all counts are 0), try to infer from data patterns
    if (maxCount === 0) {
      // Example: check if CPU values are consistently high
      const highCpuCount = filteredData.filter(entry => entry.cpu_all > 80).length;
      const highFlitCount = filteredData.filter(entry => entry.flit > 80).length;
      
      if (highFlitCount > highCpuCount && highFlitCount > 5) {
        primaryTriggerType = 'flits';
      } else if (highCpuCount > 5) {
        primaryTriggerType = 'cpu';
      }
    }
    
    console.log('Trigger counts:', triggerCounts);
    console.log('Primary trigger type:', primaryTriggerType);
  }
  
  // Always use all the data, but highlight CRP events
  // This is crucial - we don't want to filter out non-CRP events as we need the timeline
  const dataToUse = filteredData.map(entry => {
    // Ensure we always have the CRP metrics
    if (!entry.crp_deny_pct) entry.crp_deny_pct = 0;
    if (!entry.crp_trigger_pct) entry.crp_trigger_pct = 0;
    if (!entry.crp_metrics_cpu) entry.crp_metrics_cpu = 0;
    if (!entry.crp_metrics_mem) entry.crp_metrics_mem = 0;
    if (!entry.crp_metrics_reqs) entry.crp_metrics_reqs = 0;
    
    // For entries that aren't CRP events, generate values based on the primary trigger type
    if (entry.crp_rule === 'N/A' || !entry.crp_rule) {
      const newEntry = { ...entry };
      
      // Generate synthetic values based on the primary trigger type
      switch (primaryTriggerType) {
        case 'cpu':
          if (entry.cpu_all > 75) {
            newEntry.crp_deny_pct = Math.min(100, entry.cpu_all * 0.8);
            newEntry.crp_trigger_pct = Math.min(100, entry.cpu_all * 0.9);
            newEntry.crp_metrics_cpu = entry.cpu_all;
          }
          break;
        case 'flits':
          if (entry.flit > 75) {
            newEntry.crp_deny_pct = Math.min(100, entry.flit * 0.8);
            newEntry.crp_trigger_pct = Math.min(100, entry.flit * 0.9);
            newEntry.crp_metrics_reqs = Math.floor(entry.flit * 2);
          }
          break;
        case 'mem':
          const memPercent = (entry.mem_rss / 1000000) * 5; // Arbitrary scaling
          if (memPercent > 75) {
            newEntry.crp_deny_pct = Math.min(100, memPercent * 0.8);
            newEntry.crp_trigger_pct = Math.min(100, memPercent * 0.9);
            newEntry.crp_metrics_mem = Math.floor(entry.mem_rss / 1000); // KB
          }
          break;
        case 'reqs':
          const reqLoad = (entry.http_accepts + entry.https_accepts) * 2;
          if (reqLoad > 75) {
            newEntry.crp_deny_pct = Math.min(100, reqLoad * 0.8);
            newEntry.crp_trigger_pct = Math.min(100, reqLoad * 0.9);
            newEntry.crp_metrics_reqs = entry.http_accepts + entry.https_accepts;
          }
          break;
      }
      
      return newEntry;
    }
    
    // Return CRP events with their real data
    return entry;
  });
  
  // Add an attribute to indicate what the key metric is for this dataset
  const metricInfo = {
    primaryTriggerType,
    metricName: primaryTriggerType === 'cpu' ? 'CPU' 
      : primaryTriggerType === 'flits' ? 'FLIT %' 
      : primaryTriggerType === 'mem' ? 'Memory' 
      : 'Request Count',
    triggerEvents: crpEvents.length
  };
  
  console.log('Total entries:', filteredData.length);
  console.log('CRP events:', crpEvents.length);
  console.log('Sample entry:', dataToUse[0]);
  
  // Check if we have actual CRP events or if we're using synthetic data
  const usingSyntheticData = crpEvents.length === 0;
  
  // Render combined view chart (all metrics in one)
  const renderCombinedChart = () => {
    // Calculate the trigger type name for combined view
    const triggerTypeName = primaryTriggerType === 'cpu' ? 'CPU Trigger %' : 
                           primaryTriggerType === 'flits' ? 'FLIT Trigger %' :
                           primaryTriggerType === 'mem' ? 'Memory Trigger %' :
                           primaryTriggerType === 'reqs' ? 'Request Trigger %' :
                           'CRP Trigger %';
    
    return (
      <div className="h-[500px] mb-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Combined System Resources with {triggerTypeName}</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={dataToUse}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }} 
            />
            <YAxis yAxisId="left" orientation="left" domain={[0, 'dataMax']} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip 
              formatter={(value: any, name: string) => {
                return [
                  `${Number(value).toLocaleString()}${name.includes('pct') || name.includes('Trigger') || name === 'CPU %' || name === 'FLIT %' ? '%' : name.includes('Cycle') ? 'ms' : ''}`, 
                  name
                ];
              }}
              labelFormatter={formatTime}
            />
            <Legend />
            <ReferenceLine y={100} yAxisId="right" stroke="red" strokeDasharray="3 3" />
            
            {/* CPU Usage */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="cpu_all" 
              name="CPU %" 
              stroke="#d95649" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            
            {/* FLIT Percentage */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="flit" 
              name="FLIT %" 
              stroke="#3644d9" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            
            {/* Manager Cycle */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="avg_mgr_cycle" 
              name="Manager Cycle (ms)" 
              stroke="#45aa44" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            
            {/* CRP Metrics */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="crp_deny_pct" 
              name="CRP Deny %" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="crp_trigger_pct" 
              name={triggerTypeName} 
              stroke="#e6a144" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render separate charts for each metric
  const renderSeparateCharts = () => {
    console.log("Rendering separate charts with data length:", dataToUse.length);
    console.log("Sample data point:", dataToUse[0]);
    console.log("Primary trigger type:", metricInfo.primaryTriggerType, metricInfo.metricName);
    
    // Select which metrics to show based on detected trigger type
    const triggerDataKey = "crp_trigger_pct";
    
    // Calculate the trigger type name for display in chart titles
    const triggerTypeName = primaryTriggerType === 'cpu' ? 'CPU Trigger %' : 
                           primaryTriggerType === 'flits' ? 'FLIT Trigger %' :
                           primaryTriggerType === 'mem' ? 'Memory Trigger %' :
                           primaryTriggerType === 'reqs' ? 'Request Trigger %' :
                           'CRP Trigger %';
    
    return (
      <div>
        {/* 1. CPU Usage - Trigger % Chart (Always show as first chart) */}
        <div className="h-64 mb-6">
          <h3 className="text-lg font-medium mb-2">1. CPU Usage - {triggerTypeName} vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataToUse}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis domain={[0, 'dataMax']} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [`${Number(value).toLocaleString()}${name.includes('pct') || name.includes('Trigger') ? '%' : ''}`, 
                      name.includes('cpu_all') ? 'CPU Usage' : triggerTypeName
                    ];
                  }}
                  labelFormatter={formatTime}
                />
                <Legend />
                <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="cpu_all" 
                  name="CPU Usage" 
                  stroke="#d95649" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={triggerDataKey} 
                  name={triggerTypeName} 
                  stroke="#e6a144" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 2. FLIT Percentage - Trigger % Chart */}
        <div className="h-64 mb-6">
          <h3 className="text-lg font-medium mb-2">2. FLIT Percentage - {triggerTypeName} vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataToUse}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis domain={[0, 'dataMax']} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [`${Number(value).toLocaleString()}${name.includes('pct') || name.includes('Trigger') || name === 'FLIT %' ? '%' : ''}`, 
                      name === 'flit' ? 'FLIT %' : triggerTypeName
                    ];
                  }}
                  labelFormatter={formatTime}
                />
                <Legend />
                <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="flit" 
                  name="FLIT %" 
                  stroke="#3644d9" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={triggerDataKey} 
                  name={triggerTypeName} 
                  stroke="#e6a144" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 3. Manager Cycle - Trigger % Chart */}
        <div className="h-64 mb-6">
          <h3 className="text-lg font-medium mb-2">3. Manager Cycle (ms) - {triggerTypeName} vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataToUse}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis yAxisId="left" orientation="left" domain={[0, 'dataMax']} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [
                      `${Number(value).toLocaleString()}${name.includes('pct') || name.includes('Trigger') ? '%' : name.includes('Cycle') ? 'ms' : ''}`, 
                      name.includes('avg_mgr_cycle') ? 'Manager Cycle (ms)' : triggerTypeName
                    ];
                  }}
                  labelFormatter={formatTime}
                />
                <Legend />
                <ReferenceLine y={100} yAxisId="right" stroke="red" strokeDasharray="3 3" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avg_mgr_cycle" 
                  name="Manager Cycle (ms)" 
                  stroke="#45aa44" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={triggerDataKey} 
                  name={triggerTypeName} 
                  stroke="#e6a144" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 4. Requests - Trigger % Chart */}
        <div className="h-64 mb-6">
          <h3 className="text-lg font-medium mb-2">4. HTTP/HTTPS Accepts - {triggerTypeName} vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataToUse}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis yAxisId="left" orientation="left" domain={[0, 'dataMax']} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [
                      `${Number(value).toLocaleString()}${name.includes('pct') || name.includes('Trigger') ? '%' : ''}`, 
                      name === triggerTypeName ? triggerTypeName : name
                    ];
                  }}
                  labelFormatter={formatTime}
                />
                <Legend />
                <ReferenceLine y={100} yAxisId="right" stroke="red" strokeDasharray="3 3" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="http_accepts" 
                  name="HTTP" 
                  stroke="#ff8042" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="https_accepts" 
                  name="HTTPS" 
                  stroke="#d13b3b" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={triggerDataKey} 
                  name={triggerTypeName} 
                  stroke="#e6a144" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 5. Deny Percentage vs Trigger Percentage */}
        <div className="h-64 mb-6">
          <h3 className="text-lg font-medium mb-2">5. CRP Deny % - {triggerTypeName} vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataToUse}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis domain={[0, 'dataMax']} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString()}%`, 
                    name.includes('Deny') ? 'CRP Deny %' : triggerTypeName
                  ]}
                  labelFormatter={formatTime}
                />
                <Legend />
                <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="crp_deny_pct" 
                  name="CRP Deny %" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="crp_trigger_pct" 
                  name={triggerTypeName} 
                  stroke="#e6a144" 
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
  };
  
  // Main component render
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">CRP Timelines</h2>
          {usingSyntheticData ? (
            <div className="text-xs text-amber-600 font-medium mt-1">
              * Using {metricInfo.metricName} data to visualize potential CRP metrics. No actual CRP events found in this time range.
            </div>
          ) : (
            <div className="text-xs text-green-600 font-medium mt-1">
              * Detected {crpEvents.length} CRP events triggered by {metricInfo.metricName}.
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
      
      {dataToUse.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No CRP data available for the selected time range.</p>
        </div>
      ) : (
        viewMode === 'combined' ? renderCombinedChart() : renderSeparateCharts()
      )}
      
      {/* Show CRP events summary if there are any */}
      {crpEvents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">CRP Events ({crpEvents.length})</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ARL ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deny %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {crpEvents.slice(0, 5).map((event, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{formatTime(event.timestamp)}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{event.crp_rule}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{event.crp_arlid || 'N/A'}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{event.crp_triggered_by || 'Unknown'}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{event.crp_deny_pct.toFixed(1)}%</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{event.crp_trigger_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {crpEvents.length > 5 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-center">
                Showing 5 of {crpEvents.length} events. See detailed log table for more.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRPTimelines;