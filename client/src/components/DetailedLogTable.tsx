import { useState } from 'react';
import { DetailedLogEntry, TimeRange } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface DetailedLogTableProps {
  data: DetailedLogEntry[];
  showRange: TimeRange;
}

const DetailedLogTable = ({ data, showRange }: DetailedLogTableProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  // Filter data according to the selected time range
  const getDataForRange = (range: TimeRange, data: DetailedLogEntry[]) => {
    if (data.length === 0) return data;
    
    // For 'all' range, return all data
    if (range === 'all') return data;
    
    // Get the latest timestamp in the data
    const latestData = [...data].sort((a, b) => b.timestamp - a.timestamp)[0];
    const latestTimestamp = latestData ? latestData.timestamp : 0;
    
    // Calculate cutoff time based on range
    let secondsCutoff = 0;
    switch (range) {
      case '5s': secondsCutoff = 5; break;
      case '10s': secondsCutoff = 10; break;
      case '15s': secondsCutoff = 15; break;
      case '30s': secondsCutoff = 30; break;
      case '1m': secondsCutoff = 60; break;
      case '10m': secondsCutoff = 600; break;
      case '30m': secondsCutoff = 1800; break;
      case '1h': secondsCutoff = 3600; break;
      default: return data;
    }
    
    // Filter data to include only entries within the time range
    const cutoffTimestamp = latestTimestamp - secondsCutoff;
    return data.filter(entry => entry.timestamp >= cutoffTimestamp);
  };
  
  // Filter data based on time range selection
  const filteredData = getDataForRange(showRange, data);
  
  // Sort data by timestamp (most recent first for display)
  const sortedData = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
  
  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const displayData = sortedData.slice((page - 1) * pageSize, page * pageSize);
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-table-line mr-2 text-primary"></i>
        Detailed Log Data
      </h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTP</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTPS</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flit</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mem RSS</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Rule</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP ARLID</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Trigger %</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Deny %</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP CPU</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Mem</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Reqs</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Triggered</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Trigger %</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Diff</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((entry, index) => (
                <tr key={index} className={entry.crp_arlid ? "bg-yellow-50" : "hover:bg-gray-50"}>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{formatTimestamp(entry.timestamp)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.http_accepts}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.https_accepts}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.flit}%</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.cpu_all}%</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.mem_rss}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">{entry.avg_mgr_cycle.toFixed(2)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_rule !== 'N/A' ? entry.crp_rule : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_arlid !== null ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                        {entry.crp_arlid}
                      </span>
                    ) : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_trigger_pct > 0 ? entry.crp_trigger_pct.toFixed(1) : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_deny_pct > 0 ? entry.crp_deny_pct.toFixed(1) : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_metrics_cpu > 0 ? entry.crp_metrics_cpu : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_metrics_mem > 0 ? entry.crp_metrics_mem : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_metrics_reqs}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_triggered_by !== 'N/A' ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-orange-100 text-orange-800">
                        {entry.crp_triggered_by}
                      </span>
                    ) : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.crp_triggered_pct > 0 ? (
                      <span className="font-semibold">
                        {entry.crp_triggered_pct.toFixed(1)}%
                      </span>
                    ) : '0'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {entry.time_difference > 0 ? entry.time_difference : '0'}
                  </td>
                </tr>
              ))}
              
              {displayData.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-3 py-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{Math.min(pageSize, displayData.length)}</span> of{' '}
            <span className="font-medium">{sortedData.length}</span> entries
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-primary text-white">
              {page}
            </span>
            <button 
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailedLogTable;
