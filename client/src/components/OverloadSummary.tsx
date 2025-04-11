import { OverloadEvent } from '../types';

interface OverloadSummaryProps {
  overloadEvents: OverloadEvent[];
  uniqueArls: number[];
}

const OverloadSummary = ({ overloadEvents, uniqueArls }: OverloadSummaryProps) => {
  return (
    <section className="mb-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-[#ff8800] flex items-center justify-center mr-4">
            <i className="ri-alert-line text-white text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              Overload Events
              <span className="ml-2 bg-[#ff8800] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {overloadEvents.length}
              </span>
            </h3>
            <p className="text-gray-600 mt-1">System overload incidents detected during monitoring period</p>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Affected ARL IDs:</h4>
              <div className="flex flex-wrap gap-2">
                {uniqueArls.map((arlid) => (
                  <span 
                    key={arlid}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <i className="ri-hashtag mr-1"></i>
                    {arlid}
                  </span>
                ))}
                {uniqueArls.length === 0 && (
                  <span className="text-gray-500 text-sm">No ARLs affected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OverloadSummary;
