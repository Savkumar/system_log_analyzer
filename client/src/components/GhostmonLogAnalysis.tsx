import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useGhostmonData } from '../hooks/useGhostmonData';
import GhostmonLogUploader from './GhostmonLogUploader';
import { GhostmonLogEntry } from '../types';
import { formatTimestamp } from '../utils/logParser';

const GhostmonLogAnalysis = () => {
  const { 
    filteredEntries, 
    metrics, 
    loading, 
    error, 
    activeFilter,
    setActiveFilter, 
    uploadGhostmonLog 
  } = useGhostmonData();
  
  const [showRange, setShowRange] = useState<'all' | 'peak'>('all');

  const formatTime = (timestamp: number) => {
    return formatTimestamp(timestamp);
  };

  const handleFileUploaded = (content: string) => {
    uploadGhostmonLog(content);
  };

  const filterDataForRange = (data: GhostmonLogEntry[]) => {
    if (showRange === 'all' || data.length === 0) {
      return data;
    }

    // Find peak region (where flyteload is > 50% of max flyteload)
    const maxFlyteload = Math.max(...data.map(item => item.flyteload));
    const threshold = maxFlyteload * 0.5;
    
    // Find the range around peak traffic
    const peakData = data.filter(item => item.flyteload >= threshold);
    
    // If we have peak data, return it, otherwise return all data
    return peakData.length > 0 ? peakData : data;
  };

  const displayData = filterDataForRange(filteredEntries);

  const getAnalysisContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Processing ghostmon log data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="ri-error-warning-line text-xl mr-2"></i>
            <h3 className="font-semibold">Error Processing Ghostmon Log Data</h3>
          </div>
          <p>{error}</p>
        </div>
      );
    }

    if (filteredEntries.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
          <h3 className="text-lg font-medium mb-2">No Ghostmon Log Data Available</h3>
          <p className="text-gray-600">Upload a ghostmon log file to visualize the metrics.</p>
        </div>
      );
    }

    // We have data to display
    return (
      <div>
        {/* Filter controls */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex-grow">
            <h3 className="text-md font-medium mb-3">DNSP Key Filter</h3>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveFilter('all')}
              >
                All Data
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeFilter === 'S' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveFilter('S')}
              >
                dnsp_key=S
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeFilter === 'W' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveFilter('W')}
              >
                dnsp_key=W
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 flex-grow">
            <h3 className="text-md font-medium mb-3">Data Range</h3>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  showRange === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setShowRange('all')}
              >
                All Data
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  showRange === 'peak' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setShowRange('peak')}
              >
                Focus on Peak Load
              </button>
            </div>
          </div>
        </div>

        {/* Metrics summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-blue-700 mb-1">Max Flyteload</h3>
            <p className="text-2xl font-bold">{metrics.maxFlyteload.toFixed(2)}</p>
            <p className="text-sm text-blue-600 mt-1">Peak load value</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-green-700 mb-1">Avg Flyteload</h3>
            <p className="text-2xl font-bold">{metrics.avgFlyteload.toFixed(2)}</p>
            <p className="text-sm text-green-600 mt-1">Average load</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-purple-700 mb-1">Max Hits</h3>
            <p className="text-2xl font-bold">{metrics.maxHits.toLocaleString()}</p>
            <p className="text-sm text-purple-600 mt-1">Peak hit count</p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-indigo-700 mb-1">Avg Hits</h3>
            <p className="text-2xl font-bold">{metrics.avgHits.toFixed(0)}</p>
            <p className="text-sm text-indigo-600 mt-1">Average hit count</p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-amber-700 mb-1">Max Suspend Level</h3>
            <p className="text-2xl font-bold">{metrics.maxSuspendlevel}</p>
            <p className="text-sm text-amber-600 mt-1">Highest suspend level</p>
          </div>
        </div>

        {/* Flyteload Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Flyteload vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 1)]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Flyteload']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="flyteload" 
                    name="Flyteload" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Add threshold at 50% of peak flyteload */}
                  {showRange === 'peak' && (
                    <ReferenceLine 
                      y={metrics.maxFlyteload * 0.5} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label={{ value: '50% of Peak Load', position: 'left' }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Hits Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Hits vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'auto']}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Hits']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hits" 
                    name="Hits" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Suspendflag Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Suspendflag vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'auto']}
                    ticks={[0, 1]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Suspendflag']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="suspendflag" 
                    name="Suspendflag" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Suspendlevel Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Suspendlevel vs Time</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Suspendlevel']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="suspendlevel" 
                    name="Suspendlevel" 
                    stroke="#d84315" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Ghostmon Log Analysis</h2>
      
      <GhostmonLogUploader onFileUploaded={handleFileUploaded} />
      
      {getAnalysisContent()}
    </div>
  );
};

export default GhostmonLogAnalysis;