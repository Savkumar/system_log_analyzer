import { LogData, OverloadEvent, Metrics } from '../types';

interface ExecutiveSummaryProps {
  data: LogData[];
  overloadEvents: OverloadEvent[];
  metrics: Metrics;
  uniqueArls: number[];
}

const ExecutiveSummary = ({ data, overloadEvents, metrics, uniqueArls }: ExecutiveSummaryProps) => {
  // Calculate some additional stats for the executive summary
  const totalDataPoints = data.length;
  const totalOverloadEvents = overloadEvents.length;
  
  // Calculate average time between overload events (if there are multiple)
  let avgTimeBetweenEvents = 0;
  if (overloadEvents.length > 1) {
    const sortedEvents = [...overloadEvents].sort((a, b) => a.timestamp - b.timestamp);
    let totalTimeBetween = 0;
    for (let i = 1; i < sortedEvents.length; i++) {
      totalTimeBetween += sortedEvents[i].timestamp - sortedEvents[i-1].timestamp;
    }
    avgTimeBetweenEvents = totalTimeBetween / (sortedEvents.length - 1);
  }

  // Calculate peak CPU and Flit times
  const peakCpuTime = data.reduce((max, point) => 
    point.cpu_all > (max?.cpu_all || 0) ? point : max, data[0]);
  
  const peakFlitTime = data.reduce((max, point) => 
    point.flit > (max?.flit || 0) ? point : max, data[0]);
    
  // Format a timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Executive Summary
      </h2>
      <div className="bg-white rounded-lg shadow p-5">
        {/* Summary Cards */}
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
        
        {/* Executive insights */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-md font-medium mb-2">Key Insights</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Average CPU usage is <strong>{metrics.cpu.avg.toFixed(1)}%</strong>, with peaks at <strong>{metrics.cpu.max}%</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Average Flit percentage is <strong>{metrics.flit.avg.toFixed(1)}%</strong>, with peaks at <strong>{metrics.flit.max}%</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Average manager cycle time is <strong>{metrics.cycle.avg.toFixed(2)} ms</strong>
              </span>
            </li>
            {totalOverloadEvents > 1 && (
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Average time between overload events: <strong>{avgTimeBetweenEvents.toFixed(2)} seconds</strong>
                </span>
              </li>
            )}
            {totalOverloadEvents === 0 && (
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  No overload events detected during the analyzed period
                </span>
              </li>
            )}
          </ul>
        </div>
        
        {/* Placeholder for recommendations */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="text-md font-medium mb-2 text-gray-700">Recommendations</h3>
          <p className="text-gray-500 italic">
            This section will provide AI-powered recommendations based on the analyzed log data.
            Future updates will include intelligent insights about resource allocation, scaling decisions,
            and strategies to avoid overload events.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveSummary;