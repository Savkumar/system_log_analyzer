import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useGhostTrafficData } from '../hooks/useGhostTrafficData';
import GhostTrafficUploader from './GhostTrafficUploader';
import ARLTrafficAnalysis from './ARLTrafficAnalysis';
import { RPMData, RPSData, TrafficMetrics } from '../types';

const GhostTrafficAnalysis = () => {
  const { rpmData, rpsData, metrics, loading, error, uploadTrafficData } = useGhostTrafficData();
  const [showRange, setShowRange] = useState<'all' | 'peak'>('all');

  const formatTime = (timestamp: number) => {
    // Find the corresponding data point and use its formatted time
    const dataPoint = rpmData.find(d => d.timestamp === timestamp) || 
                      rpsData.find(d => d.timestamp === timestamp);
    return dataPoint?.formattedTime || '';
  };

  const handleFilesUploaded = (rpmContent: string, rpsContent: string) => {
    uploadTrafficData(rpmContent, rpsContent);
  };

  const filterDataForRange = (data: RPMData[] | RPSData[]) => {
    if (showRange === 'all' || data.length === 0) {
      return data;
    }

    // Find peak region (where traffic is > 50% of max traffic)
    // For RPM data
    if (data.length > 0 && 'requestCount' in data[0]) {
      const maxRequests = Math.max(...data.map(item => item.requestCount));
      const threshold = maxRequests * 0.5;
      
      // Find the range around peak traffic
      const peakData = data.filter(item => item.requestCount >= threshold);
      
      // If we have peak data, return it, otherwise return all data
      return peakData.length > 0 ? peakData : data;
    }
    
    return data;
  };

  const displayRpmData = filterDataForRange(rpmData);
  const displayRpsData = filterDataForRange(rpsData);

  const getTrafficAnalysisContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Processing traffic data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="ri-error-warning-line text-xl mr-2"></i>
            <h3 className="font-semibold">Error Processing Traffic Data</h3>
          </div>
          <p>{error}</p>
        </div>
      );
    }

    if (rpmData.length === 0 || rpsData.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
          <h3 className="text-lg font-medium mb-2">No Traffic Data Available</h3>
          <p className="text-gray-600">Upload RPM and RPS log files to visualize Ghost Traffic.</p>
        </div>
      );
    }

    // We have data to display
    return (
      <div>
        {/* Traffic metrics summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-blue-700 mb-1">Max RPM</h3>
            <p className="text-2xl font-bold">{metrics.maxRPM.toLocaleString()}</p>
            <p className="text-sm text-blue-600 mt-1">Peak requests per minute</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-green-700 mb-1">Avg RPM</h3>
            <p className="text-2xl font-bold">{metrics.avgRPM.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">Average requests per minute</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-purple-700 mb-1">Max RPS</h3>
            <p className="text-2xl font-bold">{metrics.maxRPS.toLocaleString()}</p>
            <p className="text-sm text-purple-600 mt-1">Peak requests per second</p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-indigo-700 mb-1">Avg RPS</h3>
            <p className="text-2xl font-bold">{metrics.avgRPS.toLocaleString()}</p>
            <p className="text-sm text-indigo-600 mt-1">Average requests per second</p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-amber-700 mb-1">Total Requests</h3>
            <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
            <p className="text-sm text-amber-600 mt-1">During {metrics.timespan}</p>
          </div>
        </div>

        {/* View Range filter */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                showRange === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-lg`}
              onClick={() => setShowRange('all')}
            >
              Show All Data
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                showRange === 'peak'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-r-lg`}
              onClick={() => setShowRange('peak')}
            >
              Focus on Peak Traffic
            </button>
          </div>
        </div>

        {/* RPM Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Overall Traffic - Requests Per Minute (RPM)</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayRpmData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Requests']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requestCount" 
                    name="Requests Per Minute" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Add threshold at peak > 50% of max */}
                  {showRange === 'peak' && (
                    <ReferenceLine 
                      y={Math.max(...rpmData.map(d => d.requestCount)) * 0.5} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label={{ value: '50% of Peak', position: 'left' }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RPS Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Overall Traffic - Requests Per Second (RPS)</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayRpsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Requests']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requestCount" 
                    name="Requests Per Second" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Add threshold at peak > 50% of max */}
                  {showRange === 'peak' && (
                    <ReferenceLine 
                      y={Math.max(...rpsData.map(d => d.requestCount)) * 0.5} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label={{ value: '50% of Peak', position: 'left' }} 
                    />
                  )}
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
      <h2 className="text-2xl font-bold mb-6">Ghost Traffic Analysis</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Overall Traffic Pattern</h3>
        <GhostTrafficUploader onFilesUploaded={handleFilesUploaded} />
        {getTrafficAnalysisContent()}
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">ARL Level Traffic Pattern</h3>
        <ARLTrafficAnalysis />
      </div>
    </div>
  );
};

export default GhostTrafficAnalysis;