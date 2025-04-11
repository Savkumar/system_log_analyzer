import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useARLTrafficData } from '../hooks/useARLTrafficData';
import ARLTrafficUploader from './ARLTrafficUploader';
import { ARLData } from '../types';
import { parseARLRPMData } from '../utils/arlTrafficParser';

const ARLTrafficAnalysis = () => {
  const { 
    arlRPMData, 
    arlRPSData, 
    loading, 
    error,
    uploadARLRPMData, 
    uploadARLRPSData 
  } = useARLTrafficData();
  
  const [selectedARLId, setSelectedARLId] = useState<number | null>(null);
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  const getAvailableARLIds = () => {
    const arlIdsRPM = arlRPMData.map(data => data.arlId);
    const arlIdsRPS = arlRPSData.map(data => data.arlId);
    
    // Combine and remove duplicates
    return Array.from(new Set([...arlIdsRPM, ...arlIdsRPS])).sort((a, b) => a - b);
  };
  
  const getARLData = (arlId: number, type: 'rpm' | 'rps'): { timestamp: number; requestCount: number; formattedTime: string }[] => {
    if (type === 'rpm') {
      const data = arlRPMData.find(data => data.arlId === arlId);
      return data ? data.requests : [];
    } else {
      const data = arlRPSData.find(data => data.arlId === arlId);
      return data ? data.requests : [];
    }
  };
  
  const getRPMChartData = (arlId: number | null) => {
    if (arlId === null) return [];
    
    const rpmData = getARLData(arlId, 'rpm');
    
    return rpmData.map(item => ({
      timestamp: item.timestamp,
      requestCount: item.requestCount,
      formattedTime: item.formattedTime
    }));
  };
  
  const getRPSChartData = (arlId: number | null) => {
    if (arlId === null) return [];
    
    const rpsData = getARLData(arlId, 'rps');
    
    return rpsData.map(item => ({
      timestamp: item.timestamp,
      requestCount: item.requestCount,
      formattedTime: item.formattedTime
    }));
  };
  
  const handleRPMFileUploaded = (content: string) => {
    uploadARLRPMData(content);
    // Select the first ARL ID if none is selected
    if (selectedARLId === null) {
      const parsedData = parseARLRPMData(content);
      if (parsedData.length > 0) {
        setSelectedARLId(parsedData[0].arlId);
      }
    }
  };
  
  const handleRPSFileUploaded = (content: string) => {
    uploadARLRPSData(content);
  };
  

  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ARL Level Traffic Pattern</h2>
      
      <ARLTrafficUploader 
        onRPMFileUploaded={handleRPMFileUploaded}
        onRPSFileUploaded={handleRPSFileUploaded}
      />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Processing ARL traffic data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="ri-error-warning-line text-xl mr-2"></i>
            <h3 className="font-semibold">Error Processing ARL Traffic Data</h3>
          </div>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          {getAvailableARLIds().length > 0 ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Select ARL ID for Analysis</h3>
                <div className="flex flex-wrap gap-2">
                  {getAvailableARLIds().map(arlId => (
                    <button
                      key={arlId}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedARLId === arlId 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedARLId(arlId)}
                    >
                      ARL {arlId}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedARLId !== null && (
                <div>
                  {/* RPM Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-3">ARL {selectedARLId} - Requests Per Minute</h3>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={getRPMChartData(selectedARLId)} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={formatTime}
                              tick={{ fontSize: 12 }} 
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any) => [Number(value).toLocaleString(), 'Requests']}
                              labelFormatter={formatTime}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="requestCount" 
                              name={`ARL ${selectedARLId} RPM`} 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              dot={{ stroke: '#8884d8', strokeWidth: 2, r: 2 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* RPS Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-3">ARL {selectedARLId} - Requests Per Second</h3>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={getRPSChartData(selectedARLId)} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={formatTime}
                              tick={{ fontSize: 12 }} 
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any) => [Number(value).toLocaleString(), 'Requests']}
                              labelFormatter={formatTime}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="requestCount" 
                              name={`ARL ${selectedARLId} RPS`} 
                              stroke="#82ca9d" 
                              strokeWidth={2}
                              dot={{ stroke: '#82ca9d', strokeWidth: 2, r: 2 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <i className="ri-file-chart-line text-5xl text-gray-400 mb-3"></i>
              <h3 className="text-lg font-medium mb-2">No ARL Traffic Data Available</h3>
              <p className="text-gray-600">Upload ARL RPM and RPS log files to visualize the traffic patterns.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ARLTrafficAnalysis;