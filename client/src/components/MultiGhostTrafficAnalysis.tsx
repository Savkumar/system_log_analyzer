import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useMultiGhostTrafficData } from '../hooks/useMultiGhostTrafficData';
import MultiFileUploader from './MultiFileUploader';
import { RPMData, RPSData } from '../types';

type DatasetVisibility = {
  arl: boolean;
  overall: boolean;
  withoutArl: boolean;
};

const MultiGhostTrafficAnalysis = () => {
  const { trafficData, metrics, loading, error, uploadTrafficData } = useMultiGhostTrafficData();
  const [showRange, setShowRange] = useState<'all' | 'peak'>('all');
  const [visibleDatasets, setVisibleDatasets] = useState<DatasetVisibility>({
    arl: true,
    overall: true,
    withoutArl: true
  });

  const formatTime = (timestamp: number) => {
    const dataPoint = trafficData.overall.rpm.find(d => d.timestamp === timestamp);
    return dataPoint?.formattedTime || '';
  };

  const handleFilesUploaded = (data: {
    arl: { rpm: string; rps: string };
    overall: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => {
    uploadTrafficData(data);
  };

  const filterDataForRange = (data: RPMData[] | RPSData[]) => {
    if (showRange === 'all' || data.length === 0) {
      return data;
    }

    if (data.length > 0 && 'requestCount' in data[0]) {
      const maxRequests = Math.max(...data.map(item => item.requestCount));
      const threshold = maxRequests * 0.5;
      const peakData = data.filter(item => item.requestCount >= threshold);
      return peakData.length > 0 ? peakData : data;
    }

    return data;
  };

  const toggleDataset = (category: keyof DatasetVisibility) => {
    setVisibleDatasets(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

    const hasData = Object.values(trafficData).some(
      category => category.rpm.length > 0 || category.rps.length > 0
    );

    if (!hasData) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
          <h3 className="text-lg font-medium mb-2">No Traffic Data Available</h3>
          <p className="text-gray-600">Upload RPM and RPS log files to visualize Ghost Traffic.</p>
        </div>
      );
    }

    return (
      <div>
        {/* Dataset Toggle Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center">
            <button
              onClick={() => toggleDataset('arl')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                visibleDatasets.arl
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              ARL Traffic
            </button>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => toggleDataset('overall')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                visibleDatasets.overall
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Overall Traffic
            </button>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => toggleDataset('withoutArl')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                visibleDatasets.withoutArl
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Without ARL
            </button>
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

        {/* Traffic Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(metrics).map(([category, categoryMetrics]) => (
            <div
              key={category}
              className={`p-6 rounded-lg shadow-sm ${
                visibleDatasets[category as keyof DatasetVisibility]
                  ? 'bg-white'
                  : 'bg-gray-50'
              }`}
            >
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()} Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Max RPM</p>
                  <p className="text-2xl font-bold">{categoryMetrics.maxRPM.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Max RPS</p>
                  <p className="text-2xl font-bold">{categoryMetrics.maxRPS.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{categoryMetrics.totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RPM Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Comparative RPM Analysis</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

                  {visibleDatasets.arl && (
                    <Line
                      data={filterDataForRange(trafficData.arl.rpm)}
                      type="monotone"
                      dataKey="requestCount"
                      name="ARL RPM"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleDatasets.overall && (
                    <Line
                      data={filterDataForRange(trafficData.overall.rpm)}
                      type="monotone"
                      dataKey="requestCount"
                      name="Overall RPM"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleDatasets.withoutArl && (
                    <Line
                      data={filterDataForRange(trafficData.withoutArl.rpm)}
                      type="monotone"
                      dataKey="requestCount"
                      name="Without ARL RPM"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RPS Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Comparative RPS Analysis</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

                  {visibleDatasets.arl && (
                    <Line
                      data={filterDataForRange(trafficData.arl.rps)}
                      type="monotone"
                      dataKey="requestCount"
                      name="ARL RPS"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleDatasets.overall && (
                    <Line
                      data={filterDataForRange(trafficData.overall.rps)}
                      type="monotone"
                      dataKey="requestCount"
                      name="Overall RPS"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleDatasets.withoutArl && (
                    <Line
                      data={filterDataForRange(trafficData.withoutArl.rps)}
                      type="monotone"
                      dataKey="requestCount"
                      name="Without ARL RPS"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
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
        <h3 className="text-xl font-semibold mb-4">Traffic Pattern Analysis</h3>
        <MultiFileUploader onFilesUploaded={handleFilesUploaded} />
        {getTrafficAnalysisContent()}
      </div>
    </div>
  );
};

export default MultiGhostTrafficAnalysis;