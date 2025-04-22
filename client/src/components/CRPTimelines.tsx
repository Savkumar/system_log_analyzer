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
import { formatTimestamp } from '../utils/logParser';

interface CRPTimelinesProps {
  data: DetailedLogEntry[];
  showRange: TimeRange;
  setShowRange: React.Dispatch<React.SetStateAction<TimeRange>>;
}

interface MetricConfig {
  key: string;
  name: string;
  color: string;
  yAxisId?: 'left' | 'right';
  unit?: string;
}

interface ChartConfig {
  title: string;
  metrics: MetricConfig[];
}

const CRPTimelines = ({ data, showRange, setShowRange }: CRPTimelinesProps) => {
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('separate');
  
  // Format timestamps for display
  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };
  
  // Format timestamps with date and time for separate views
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const time = formatTimestamp(timestamp);
    return `${year}-${month}-${day} ${time}`;
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">CRP Timelines</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'combined' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Combined View
            </button>
            <button
              onClick={() => setViewMode('separate')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'separate' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Separate Views
            </button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  // Process to find CRP events
  const crpEvents = filteredData.filter(entry => entry.crp_rule && entry.crp_rule !== 'N/A');
  
  // Determine primary trigger type
  let primaryTriggerType = 'cpu';
  if (crpEvents.length > 0) {
    const triggerCounts = {
      'cpu': 0,
      'flits': 0,
      'mem': 0,
      'reqs': 0
    };
    
    crpEvents.forEach(event => {
      const triggeredBy = event.crp_triggered_by?.toLowerCase() || '';
      if (triggeredBy.includes('cpu')) triggerCounts.cpu++;
      else if (triggeredBy.includes('flit')) triggerCounts.flits++;
      else if (triggeredBy.includes('mem')) triggerCounts.mem++;
      else if (triggeredBy.includes('req')) triggerCounts.reqs++;
    });
    
    let maxCount = 0;
    for (const [type, count] of Object.entries(triggerCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryTriggerType = type;
      }
    }
  }

  // Process and validate data
  const validData = filteredData.map(entry => ({
    ...entry,
    timestamp: entry.timestamp,
    cpu_all: Number(entry.cpu_all) || 0,
    flit: Number(entry.flit) || 0,
    avg_mgr_cycle: Number(entry.avg_mgr_cycle) || 0,
    http_accepts: Number(entry.http_accepts) || 0,
    https_accepts: Number(entry.https_accepts) || 0,
    crp_deny_pct: Number(entry.crp_deny_pct) || 0,
    crp_trigger_pct: Number(entry.crp_trigger_pct) || 0
  }));

  // Reusable chart component
  const TimelineChart: React.FC<ChartConfig> = ({ title, metrics }) => {
    const hasPercentageMetrics = metrics.some(m => 
      m.key.includes('pct') || m.key === 'cpu_all' || m.key === 'flit'
    );

    return (
      <div className="h-[300px] mb-6">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={validData}
              margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDateTime}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
                minTickGap={50}
              />
              {metrics.some(m => m.yAxisId === 'right') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                />
              )}
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[0, 'auto']}
                tickFormatter={value => {
                  const metric = metrics.find(m => m.yAxisId !== 'right');
                  return `${value}${metric?.unit || ''}`;
                }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const metric = metrics.find(m => m.name === name);
                  const isPercentage = hasPercentageMetrics && metric?.yAxisId === 'right';
                  return [
                    `${Number(value).toLocaleString()}${isPercentage ? '%' : metric?.unit || ''}`,
                    name
                  ];
                }}
                labelFormatter={formatDateTime}
              />
              <Legend />
              {hasPercentageMetrics && (
                <ReferenceLine y={100} yAxisId="right" stroke="red" strokeDasharray="3 3" />
              )}
              {metrics.map(metric => (
                <Line
                  key={metric.key}
                  yAxisId={metric.yAxisId || 'left'}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.name}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render separate charts
  const renderSeparateCharts = () => {
    if (!validData?.length) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No data available for charts.</p>
        </div>
      );
    }

    const triggerTypeName = primaryTriggerType === 'cpu' ? 'CPU Trigger %' :
                           primaryTriggerType === 'flits' ? 'FLIT Trigger %' :
                           primaryTriggerType === 'mem' ? 'Memory Trigger %' :
                           primaryTriggerType === 'reqs' ? 'Request Trigger %' :
                           'CRP Trigger %';

    const charts: ChartConfig[] = [
      {
        title: "1. CPU Usage vs Time",
        metrics: [
          { key: 'cpu_all', name: 'CPU Usage', color: '#d95649', yAxisId: 'right' },
          { key: 'crp_trigger_pct', name: triggerTypeName, color: '#e6a144', yAxisId: 'right' }
        ]
      },
      {
        title: "2. FLIT Percentage vs Time",
        metrics: [
          { key: 'flit', name: 'FLIT %', color: '#3644d9', yAxisId: 'right' },
          { key: 'crp_trigger_pct', name: triggerTypeName, color: '#e6a144', yAxisId: 'right' }
        ]
      },
      {
        title: "3. Manager Cycle vs Time",
        metrics: [
          { key: 'avg_mgr_cycle', name: 'Manager Cycle', color: '#45aa44', unit: 'ms' },
          { key: 'crp_trigger_pct', name: triggerTypeName, color: '#e6a144', yAxisId: 'right' }
        ]
      },
      {
        title: "4. HTTP/HTTPS Accepts vs Time",
        metrics: [
          { key: 'http_accepts', name: 'HTTP', color: '#ff8042' },
          { key: 'https_accepts', name: 'HTTPS', color: '#d13b3b' },
          { key: 'crp_trigger_pct', name: triggerTypeName, color: '#e6a144', yAxisId: 'right' }
        ]
      },
      {
        title: "5. CRP Metrics vs Time",
        metrics: [
          { key: 'crp_deny_pct', name: 'CRP Deny %', color: '#8884d8', yAxisId: 'right' },
          { key: 'crp_trigger_pct', name: triggerTypeName, color: '#e6a144', yAxisId: 'right' }
        ]
      }
    ];

    return (
      <div>
        {charts.map((chart, index) => (
          <TimelineChart key={index} {...chart} />
        ))}
      </div>
    );
  };

  // Render combined view chart
  const renderCombinedChart = () => {
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
            data={validData}
            margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
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

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">CRP Timelines</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'combined' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Combined View
          </button>
          <button
            onClick={() => setViewMode('separate')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'separate' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Separate Views
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['5s', '10s', '15s', '30s', '1m', '10m', '30m', '1h', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setShowRange(range as TimeRange)}
              className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${
                showRange === range ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {viewMode === 'combined' ? renderCombinedChart() : renderSeparateCharts()}
      </div>
    </div>
  );
};

export default CRPTimelines;