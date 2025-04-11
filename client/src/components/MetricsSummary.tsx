import { Metrics } from '../types';

interface MetricsSummaryProps {
  metrics: Metrics;
}

const MetricsSummary = ({ metrics }: MetricsSummaryProps) => {
  // Calculate percentage widths for progress bars
  const cpuPercentage = Math.min(metrics.cpu.avg, 100);
  const flitPercentage = Math.min(metrics.flit.avg, 100);
  const cyclePercentage = Math.min((metrics.cycle.avg / metrics.cycle.max) * 100 || 0, 100);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-dashboard-line mr-2 text-primary"></i>
        System Metrics Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Metrics Card */}
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#ff0000]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">CPU Usage</h3>
              <p className="text-gray-500 text-sm">System processor utilization</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <i className="ri-cpu-line text-[#ff0000] text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 uppercase">Min</p>
                <p className="font-mono font-medium text-lg">{metrics.cpu.min.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Avg</p>
                <p className="font-mono font-medium text-lg">{metrics.cpu.avg.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Max</p>
                <p className="font-mono font-medium text-lg">{metrics.cpu.max.toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#ff0000] h-2.5 rounded-full" 
                style={{ width: `${cpuPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Flit Percentage Card */}
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#0000ff]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Flit Percentage</h3>
              <p className="text-gray-500 text-sm">Network packet utilization</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="ri-swap-line text-[#0000ff] text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 uppercase">Min</p>
                <p className="font-mono font-medium text-lg">{metrics.flit.min.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Avg</p>
                <p className="font-mono font-medium text-lg">{metrics.flit.avg.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Max</p>
                <p className="font-mono font-medium text-lg">{metrics.flit.max.toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#0000ff] h-2.5 rounded-full" 
                style={{ width: `${flitPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Manager Cycle Card */}
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#00aa00]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Manager Cycle</h3>
              <p className="text-gray-500 text-sm">Process cycle duration</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <i className="ri-timer-line text-[#00aa00] text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 uppercase">Min</p>
                <p className="font-mono font-medium text-lg">{metrics.cycle.min.toFixed(2)} ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Avg</p>
                <p className="font-mono font-medium text-lg">{metrics.cycle.avg.toFixed(2)} ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Max</p>
                <p className="font-mono font-medium text-lg">{metrics.cycle.max.toFixed(2)} ms</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#00aa00] h-2.5 rounded-full" 
                style={{ width: `${cyclePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MetricsSummary;
