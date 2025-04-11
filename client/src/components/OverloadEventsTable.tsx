import { OverloadEvent } from '../types';
import { formatTimestamp } from '../utils/logParser';

interface OverloadEventsTableProps {
  overloadEvents: OverloadEvent[];
}

const OverloadEventsTable = ({ overloadEvents }: OverloadEventsTableProps) => {
  // Sort events by timestamp descending (most recent first)
  const sortedEvents = [...overloadEvents].sort((a, b) => b.timestamp - a.timestamp);
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-table-line mr-2 text-primary"></i>
        Overload Events Detail
      </h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ARL ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Trigger</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System CPU</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flit %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEvents.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                      {event.arlid || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.rule || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    <span className="text-[#ff8800] font-medium">
                      {event.triggered_by_cpu.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {event.cpu_all}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {event.flit}%
                  </td>
                </tr>
              ))}
              {overloadEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No overload events detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{overloadEvents.length}</span> events
          </div>
          <div>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export Events
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OverloadEventsTable;
