import { useState } from 'react';
import MetricsSummary from './MetricsSummary';
import OverloadSummary from './OverloadSummary';
import SystemResourcesChart from './SystemResourcesChart';
import CPUFlitChart from './CPUFlitChart';
import CRPTimelines from './CRPTimelines';
import OverloadEventsTable from './OverloadEventsTable';
import DetailedLogTable from './DetailedLogTable';
import LogFileUploader from './LogFileUploader';
import ExecutiveSummary from './ExecutiveSummary';
import GhostTrafficAnalysis from './GhostTrafficAnalysis';
import GhostmonLogAnalysis from './GhostmonLogAnalysis';
import useLogData from '../hooks/useLogData';
import { TimeRange } from '../types';

const ServerPerformanceAnalysis = () => {
  const { data, overloadEvents, detailedEntries, metrics, uniqueArls, loading, refreshData } = useLogData();
  const [showRange, setShowRange] = useState<TimeRange>('all');
  const [showDetailedTable, setShowDetailedTable] = useState<boolean>(false);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Server Performance Analysis</h1>
          <p className="text-gray-600">Real-time monitoring and visualization of server metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshData}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light transition-colors"
          >
            <i className="ri-refresh-line"></i>
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowDetailedTable(!showDetailedTable)}
            className={`flex items-center gap-1 px-4 py-2 border rounded transition-colors ${
              showDetailedTable 
                ? 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <i className="ri-table-line"></i>
            <span>{showDetailedTable ? 'Hide Detailed Table' : 'Show Detailed Table'}</span>
          </button>
          <button className="flex items-center gap-1 px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors">
            <i className="ri-download-line"></i>
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="mb-6">
        <LogFileUploader onFileUploaded={refreshData} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Loading server performance data...</p>
        </div>
      ) : (
        <div>
          <ExecutiveSummary 
            data={data}
            overloadEvents={overloadEvents}
            metrics={metrics}
            uniqueArls={uniqueArls}
          />
          
          <MetricsSummary metrics={metrics} />
          
          <OverloadSummary 
            overloadEvents={overloadEvents} 
            uniqueArls={uniqueArls} 
          />
          
          <SystemResourcesChart 
            data={data} 
            overloadEvents={overloadEvents} 
            showRange={showRange}
            setShowRange={setShowRange}
          />
          
          <CPUFlitChart 
            data={data} 
            showRange={showRange}
          />
          
          <CRPTimelines
            data={detailedEntries}
            showRange={showRange}
            setShowRange={setShowRange}
          />
          
          <OverloadEventsTable overloadEvents={overloadEvents} />
          
          {showDetailedTable && (
            <DetailedLogTable 
              data={detailedEntries}
              showRange={showRange}
            />
          )}
          
          {/* Ghost Traffic Analysis Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <GhostTrafficAnalysis />
          </div>
          
          {/* Ghostmon Log Analysis Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <GhostmonLogAnalysis />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerPerformanceAnalysis;
