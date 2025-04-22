import { useState, useRef, useEffect, useMemo } from 'react';
import MetricsSummary from './MetricsSummary';
import OverloadSummary from './OverloadSummary';
import { formatTimestamp } from '../utils/logParser';
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
import { useGhostTrafficData } from '../hooks/useGhostTrafficData';
import { useARLTrafficData } from '../hooks/useARLTrafficData';
import { TimeRange, RPMData, RPSData, ARLData } from '../types';
import { useToast } from '@/hooks/use-toast';

const ServerPerformanceAnalysis = () => {
  const { data, overloadEvents, detailedEntries, metrics: baseMetrics, uniqueArls, loading, refreshData } = useLogData();
  const [trafficAnalysis, setTrafficAnalysis] = useState<{
    correlation: number;
    patternSimilarity: number;
    anomalies: { timestamp: number; value: number; deviation: number }[];
  } | null>(null);

  const metrics = useMemo(() => ({
    ...baseMetrics,
    ...(trafficAnalysis && {
      correlation: trafficAnalysis.correlation,
      patternSimilarity: trafficAnalysis.patternSimilarity,
      anomalies: trafficAnalysis.anomalies
    })
  }), [baseMetrics, trafficAnalysis]);
  const { rpmData, rpsData, metrics: trafficMetrics } = useGhostTrafficData();
  const { arlRPMData, arlRPSData } = useARLTrafficData();
  const [showRange, setShowRange] = useState<TimeRange>('all');
  const [showDetailedTable, setShowDetailedTable] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareId, setShareId] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const { toast } = useToast();
  const linkRef = useRef<HTMLInputElement>(null);

  // Function to generate a shareable link
  const generateShareableLink = async () => {
    try {
      // Generate unique ID based on timestamp and random string
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setShareId(uniqueId);

      // Create shareable link using current hostname and path
      const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
      const link = `${baseUrl}?share=${uniqueId}`;
      setShareLink(link);

      // Prepare data to save
      const reportData = {
        shareId: uniqueId,
        data: {
          metrics,
          overloadEvents,
          uniqueArls,
          // We don't include full detailed entries to keep data size manageable
          detailedEntries: detailedEntries.slice(0, 50), // Just save first 50 entries
          showRange,
          timestamp: new Date().toISOString()
        },
        description: `Performance analysis report created on ${formatTimestamp(Math.floor(Date.now() / 1000))}`
      };

      // Save to server
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      setShowShareModal(true);
      console.log('Generated shareable link:', link);
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select();
      document.execCommand('copy');
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard."
      });
    }
  };
  
  // Check if this is a shared link when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('share');
    
    if (sharedId) {
      // Load the saved analysis data from the SQLite database
      const fetchSharedReport = async () => {
        try {
          const response = await fetch(`/api/reports/${sharedId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load shared report');
          }
          
          const report = await response.json();
          console.log('Loaded shared analysis with ID:', sharedId);
          
          // Set the share ID
          setShareId(sharedId);
          
          // Extract data from the report
          if (report.data) {
            const { metrics: reportMetrics, overloadEvents: reportEvents, 
                   uniqueArls: reportArls, detailedEntries: reportEntries,
                   showRange: reportRange } = report.data;
            
            // Update local state with the loaded data
            // Note: In a real implementation, we would have proper state management
            // This is simplified for demonstration
            if (reportRange) setShowRange(reportRange);
            
            // You would need to update the shared data states through a context or reducer
            // For now we'll just show a notification that data was loaded
            toast({
              title: "Shared Analysis Loaded",
              description: `Loading a shared analysis created on ${formatTimestamp(Math.floor(new Date(report.data.timestamp).getTime() / 1000))}`,
            });
          }
        } catch (error) {
          console.error('Error loading shared report:', error);
          toast({
            title: "Error",
            description: "Failed to load the shared analysis. It may have expired or been deleted.",
            variant: "destructive"
          });
          
          // Fall back to refreshing current data
          refreshData();
        }
      };
      
      fetchSharedReport();
    }
  }, [toast, refreshData]);

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
          <button 
            onClick={generateShareableLink}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <i className="ri-share-line"></i>
            <span>Share</span>
          </button>
          <button
            onClick={async () => {
              try {
                // Prepare report data
                const reportData = {
                  data,
                  overloadEvents,
                  metrics,
                  uniqueArls,
                  detailedEntries: detailedEntries.slice(0, 50),
                  ghostRPM: rpmData.map(d => d.requestCount),
                  ghostRPS: rpsData.map(d => d.requestCount),
                  arlRPM: arlRPMData.flatMap(d => d.requests.map(r => r.requestCount)),
                  arlRPS: arlRPSData.flatMap(d => d.requests.map(r => r.requestCount)),
                  timestamp: new Date().toISOString()
                };

                // Request standalone HTML bundle
                const response = await fetch('/api/export-report', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(reportData)
                });

                if (!response.ok) {
                  throw new Error('Failed to generate report');
                }

                // Get the HTML content
                const blob = await response.blob();
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-report-${new Date().toISOString().split('T')[0]}.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                  title: "Report Exported",
                  description: "Your interactive report has been downloaded successfully."
                });
              } catch (error) {
                console.error('Error exporting report:', error);
                toast({
                  title: "Export Failed",
                  description: "Failed to generate report. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            className="flex items-center gap-1 px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
          >
            <i className="ri-download-line"></i>
            <span>Export Report</span>
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
            ghostRPM={rpmData.map((d: RPMData) => d.requestCount)}
            ghostRPS={rpsData.map((d: RPSData) => d.requestCount)}
            arlRPM={arlRPMData.flatMap((d: ARLData) => d.requests.map(r => r.requestCount))}
            arlRPS={arlRPSData.flatMap((d: ARLData) => d.requests.map(r => r.requestCount))}
            memoryUsage={detailedEntries.map(entry => ({
              timestamp: entry.timestamp,
              value: entry.mem_rss || 0
            }))}
            detailedEntries={detailedEntries}
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
            <GhostTrafficAnalysis
              onTrafficAnalysis={setTrafficAnalysis}
            />
          </div>
          
          {/* Ghostmon Log Analysis Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <GhostmonLogAnalysis />
          </div>
        </div>
      )}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Share Analysis</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <p className="mb-4 text-gray-600">
              Share this link to allow others to view your current analysis. The link includes your current filters and selected data.
            </p>
            <div className="flex items-center mb-6">
              <input
                ref={linkRef}
                type="text"
                value={shareLink}
                readOnly
                className="flex-grow border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={copyToClipboard}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerPerformanceAnalysis;
