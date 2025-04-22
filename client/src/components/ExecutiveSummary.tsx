import { LogData, OverloadEvent, Metrics, DetailedLogEntry, TrafficAnomaly } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface ExecutiveSummaryProps {
  data: LogData[];
  overloadEvents: OverloadEvent[];
  metrics: Metrics & {
    correlation?: number;
    patternSimilarity?: number;
    anomalies?: TrafficAnomaly[];
  };
  uniqueArls: number[];
  ghostRPM?: number[];
  ghostRPS?: number[];
  arlRPM?: number[];
  arlRPS?: number[];
  memoryUsage?: { timestamp: number; value: number }[];
  detailedEntries?: DetailedLogEntry[];
}

const ExecutiveSummary = ({
  data,
  overloadEvents,
  metrics,
  uniqueArls,
  ghostRPM = [],
  ghostRPS = [],
  arlRPM = [],
  arlRPS = [],
  memoryUsage = [],
  detailedEntries = []
}: ExecutiveSummaryProps) => {
  // Calculate time range information
  const startTime = data.length > 0 ? data[0].timestamp : 0;
  const endTime = data.length > 0 ? data[data.length - 1].timestamp : 0;
  const analysisDuration = endTime - startTime;
  const durationHours = Math.floor(analysisDuration / 3600);
  const durationMinutes = Math.floor((analysisDuration % 3600) / 60);
  const durationSeconds = Math.floor(analysisDuration % 60);

  // Calculate metrics
  const totalDataPoints = data.length;
  const totalOverloadEvents = overloadEvents.length;
  
  // Calculate average time between overload events
  let avgTimeBetweenEvents = 0;
  if (overloadEvents.length > 1) {
    const sortedEvents = [...overloadEvents].sort((a, b) => a.timestamp - b.timestamp);
    let totalTimeBetween = 0;
    for (let i = 1; i < sortedEvents.length; i++) {
      totalTimeBetween += sortedEvents[i].timestamp - sortedEvents[i-1].timestamp;
    }
    avgTimeBetweenEvents = totalTimeBetween / (sortedEvents.length - 1);
  }

  // Calculate traffic metrics
  const avgGhostRPM = ghostRPM.length > 0
    ? ghostRPM.reduce((sum, val) => sum + val, 0) / ghostRPM.length
    : 0;
  const maxGhostRPM = ghostRPM.length > 0
    ? Math.max(...ghostRPM)
    : 0;
  
  const avgGhostRPS = ghostRPS.length > 0
    ? ghostRPS.reduce((sum, val) => sum + val, 0) / ghostRPS.length
    : 0;
  const maxGhostRPS = ghostRPS.length > 0
    ? Math.max(...ghostRPS)
    : 0;

  const avgARLRPM = arlRPM.length > 0
    ? arlRPM.reduce((sum, val) => sum + val, 0) / arlRPM.length
    : 0;
  const maxARLRPM = arlRPM.length > 0
    ? Math.max(...arlRPM)
    : 0;

  // Calculate memory metrics
  const avgMemory = memoryUsage.length > 0
    ? memoryUsage.reduce((sum, point) => sum + point.value, 0) / memoryUsage.length
    : 0;
  const maxMemory = memoryUsage.length > 0
    ? Math.max(...memoryUsage.map(point => point.value))
    : 0;

  // Calculate peak CPU and Flit times
  const peakCpuTime = data.reduce((max, point) => 
    point.cpu_all > (max?.cpu_all || 0) ? point : max, data[0]);
  
  const peakFlitTime = data.reduce((max, point) => 
    point.flit > (max?.flit || 0) ? point : max, data[0]);
    
  // Format a timestamp for display
  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Executive Summary
      </h2>
      <div className="bg-white rounded-lg shadow p-5">
        {/* Summary Cards */}
        {/* Time Range Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-md font-medium mb-2">Analysis Time Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Start Time</p>
              <p className="font-medium">{formatTime(startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Time</p>
              <p className="font-medium">{formatTime(endTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium">
                {durationHours > 0 ? `${durationHours}h ` : ''}
                {durationMinutes > 0 ? `${durationMinutes}m ` : ''}
                {durationSeconds}s
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-blue-700 mb-1">Data Points</h3>
            <p className="text-2xl font-bold">{totalDataPoints}</p>
            <p className="text-sm text-blue-600 mt-1">Total data points analyzed</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-red-700 mb-1">Overload Events</h3>
            <p className="text-2xl font-bold">{totalOverloadEvents}</p>
            <p className="text-sm text-red-600 mt-1">
              {totalOverloadEvents > 0 
                ? `Affecting ${uniqueArls.length} unique ARLs` 
                : 'No overload events detected'}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-green-700 mb-1">Peak CPU</h3>
            <p className="text-2xl font-bold">{metrics.cpu.max}%</p>
            <p className="text-sm text-green-600 mt-1">
              At {peakCpuTime ? formatTime(peakCpuTime.timestamp) : 'N/A'}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-purple-700 mb-1">Peak Flit</h3>
            <p className="text-2xl font-bold">{metrics.flit.max}%</p>
            <p className="text-sm text-purple-600 mt-1">
              At {peakFlitTime ? formatTime(peakFlitTime.timestamp) : 'N/A'}
            </p>
          </div>
        </div>
        
        {/* System Insights */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-md font-medium mb-2">System Performance Insights</h3>
          <ul className="space-y-2">
            {/* CPU Analysis */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                CPU utilization ranges from <strong>{metrics.cpu.min}%</strong> to <strong>{metrics.cpu.max}%</strong>,
                averaging <strong>{metrics.cpu.avg.toFixed(1)}%</strong>
                {metrics.cpu.max > 90 && " (High CPU peaks detected)"}
              </span>
            </li>

            {/* FLIT Analysis */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                FLIT percentage varies from <strong>{metrics.flit.min}%</strong> to <strong>{metrics.flit.max}%</strong>,
                averaging <strong>{metrics.flit.avg.toFixed(1)}%</strong>
                {metrics.flit.max > 100 && " (FLIT saturation observed)"}
              </span>
            </li>

            {/* Manager Cycle Analysis */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Manager cycle time ranges from <strong>{metrics.cycle.min.toFixed(2)}</strong> to <strong>{metrics.cycle.max.toFixed(2)} ms</strong>,
                averaging <strong>{metrics.cycle.avg.toFixed(2)} ms</strong>
                {metrics.cycle.max > 20 && " (High cycle times may indicate processing delays)"}
              </span>
            </li>

            {/* Memory Usage Patterns */}
            {memoryUsage.length > 0 && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Memory consumption averages <strong>{(avgMemory / 1024).toFixed(1)} MB</strong>,
                  peaking at <strong>{(maxMemory / 1024).toFixed(1)} MB</strong>
                  {maxMemory > 1024 * 1024 && " (High memory utilization detected)"}
                </span>
              </li>
            )}

            {/* Traffic Impact Analysis */}
            {ghostRPM.length > 0 && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Ghost traffic peaks at <strong>{maxGhostRPM.toFixed(1)}</strong> RPM with
                  <strong> {maxGhostRPS.toFixed(1)}</strong> RPS spikes
                  {maxGhostRPM > 1000 && " (High traffic load observed)"}
                </span>
              </li>
            )}

            {/* Overload Event Analysis */}
            {totalOverloadEvents > 1 && (
              <>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    System experiencing overload events every <strong>{avgTimeBetweenEvents.toFixed(2)} seconds</strong>,
                    impacting <strong>{uniqueArls.length}</strong> unique ARLs
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Primary trigger: {overloadEvents.reduce((acc, event) => {
                      if (event.rule?.toLowerCase().includes('flit')) return 'FLIT saturation';
                      if (event.rule?.toLowerCase().includes('cpu')) return 'CPU overload';
                      return acc;
                    }, 'Multiple factors')}
                  </span>
                </li>
              </>
            )}
            {totalOverloadEvents === 0 && (
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  System operating within normal parameters - no overload events detected
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Traffic Analysis */}
        <div className="bg-amber-50 rounded-lg p-4 mb-4">
          <h3 className="text-md font-medium mb-2">Traffic Analysis</h3>
          <ul className="space-y-2">
            {/* Overall Traffic Patterns */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Overall traffic shows {maxGhostRPM > 1000 ? 'high' : maxGhostRPM > 500 ? 'moderate' : 'low'} volume
                with {Math.abs(maxGhostRPM/60 - maxGhostRPS) > 100 ? 'significant' : 'minimal'} RPM/RPS variance,
                averaging <strong>{avgGhostRPM.toFixed(1)}</strong> requests per minute
              </span>
            </li>

            {/* ARL Traffic Insights */}
            {arlRPM.length > 0 && (
              <>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    ARL traffic distribution shows {maxARLRPM > maxGhostRPM/2 ? 'concentrated' : 'distributed'} load pattern,
                    with {uniqueArls.length} unique ARLs {
                      uniqueArls.length > 10
                        ? 'indicating diverse traffic sources'
                        : 'suggesting focused traffic patterns'
                    }
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    ARL to Overall traffic ratio peaks at <strong>{((maxARLRPM / maxGhostRPM) * 100).toFixed(1)}%</strong> during high load periods,
                    with {maxARLRPM > maxGhostRPM/2 ? 'significant' : 'moderate'} contribution to overall system load
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Traffic pattern correlation: <strong>{metrics.correlation || 0}</strong>
                    (<span className="text-gray-600">
                      {metrics.correlation > 0.7 ? 'Strong' : metrics.correlation > 0.4 ? 'Moderate' : 'Weak'} correlation with overall traffic
                    </span>)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Pattern similarity: <strong>{metrics.patternSimilarity || 0}%</strong> match with overall traffic trends
                  </span>
                </li>
                {metrics.anomalies && metrics.anomalies.length > 0 && (
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">⚠</span>
                    <span>
                      Detected <strong>{metrics.anomalies.length}</strong> anomalous traffic pattern{metrics.anomalies.length > 1 ? 's' : ''}
                      with peak deviation of <strong>{Math.max(...metrics.anomalies.map(a => a.deviation))}σ</strong> from mean
                    </span>
                  </li>
                )}
                {overloadEvents.length > 0 && (
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>
                      During overload events, ARL traffic {
                        avgARLRPM > avgGhostRPM/2
                          ? 'shows strong correlation with system stress'
                          : 'maintains moderate impact on system performance'
                      }, with peak ARL RPM of <strong>{maxARLRPM.toFixed(1)}</strong> coinciding with system overload triggers
                    </span>
                  </li>
                )}
              </>
            )}

            {/* HTTP/HTTPS Distribution */}
            {detailedEntries[0]?.http_accepts !== undefined && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Traffic composition: {
                    detailedEntries[0].https_accepts > detailedEntries[0].http_accepts
                      ? 'HTTPS-dominant'
                      : detailedEntries[0].http_accepts > detailedEntries[0].https_accepts
                        ? 'HTTP-dominant'
                        : 'balanced HTTP/HTTPS'
                  } with ratio {(detailedEntries[0].https_accepts / (detailedEntries[0].http_accepts || 1)).toFixed(2)}:1
                </span>
              </li>
            )}

            {/* Performance Impact */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Traffic impact on system: {
                  maxGhostRPM > 1000 && metrics.cpu.max > 90
                    ? 'severe (high load causing resource saturation)'
                    : maxGhostRPM > 500 && metrics.cpu.max > 70
                      ? 'moderate (notable resource utilization)'
                      : 'minimal (well within capacity)'
                }
              </span>
            </li>
          </ul>
        </div>

        {/* Timeline Analysis */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="text-md font-medium mb-2">Timeline Analysis</h3>
          <ul className="space-y-2">
            {/* Resource Timeline Correlations */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Resource timeline shows {metrics.cpu.max > metrics.flit.max ? 'CPU-dominated' : 'FLIT-dominated'} pattern,
                with {metrics.cycle.max > 20 ? 'significant' : 'minimal'} manager cycle impact
                {metrics.cpu.max > 90 && metrics.flit.max > 90 && " during concurrent high utilization periods"}
              </span>
            </li>

            {/* CRP Timeline Patterns */}
            {totalOverloadEvents > 0 && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  CRP events {avgTimeBetweenEvents < 5 ? 'cluster tightly' : 'spread evenly'} across timeline,
                  primarily triggered during {overloadEvents.reduce((acc, event) => {
                    if (event.cpu_all > 90) return 'peak CPU utilization';
                    if (event.flit > 90) return 'FLIT saturation';
                    return acc;
                  }, 'high load')} periods
                </span>
              </li>
            )}

            {/* Traffic Pattern Analysis */}
            {ghostRPM.length > 0 && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Traffic patterns show {maxGhostRPM > 1000 ? 'sharp spikes' : 'gradual changes'} in RPM,
                  with {maxGhostRPS > maxGhostRPM/60 ? 'bursty' : 'consistent'} per-second distribution
                  {maxGhostRPM > 1000 && " during peak periods"}
                </span>
              </li>
            )}

            {/* System State Correlation */}
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                System state transitions from {
                  metrics.cpu.max < 70 && metrics.flit.max < 70
                    ? 'stable operation'
                    : metrics.cpu.max > 90 && metrics.flit.max > 90
                      ? 'critical overload'
                      : 'moderate stress'
                } {totalOverloadEvents > 0 ? 'triggering protective measures' : 'maintaining stability'}
              </span>
            </li>
          </ul>
        </div>

        {/* Memory Usage */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-md font-medium mb-2 text-indigo-700">Memory Usage</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-indigo-600">Average Usage</p>
              <p className="text-xl font-bold">{(avgMemory / 1024).toFixed(1)} MB</p>
            </div>
            <div>
              <p className="text-sm text-indigo-600">Peak Usage</p>
              <p className="text-xl font-bold">{(maxMemory / 1024).toFixed(1)} MB</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveSummary;