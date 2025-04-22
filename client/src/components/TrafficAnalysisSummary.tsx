import { useMemo } from 'react';
import { generateTrafficAnalysis } from '../utils/trafficAnalysis';
import { formatTimestamp } from '../utils/logParser';

interface TrafficAnalysisSummaryProps {
  arlData: { requestCount: number; timestamp: number }[];
  overallData: { requestCount: number; timestamp: number }[];
  arlId: number;
  onAnalysisComplete?: (analysis: {
    correlation: number;
    patternSimilarity: number;
    anomalies: { timestamp: number; value: number; deviation: number }[];
  }) => void;
}

const TrafficAnalysisSummary = ({ arlData, overallData, arlId, onAnalysisComplete }: TrafficAnalysisSummaryProps) => {
  const analysis = useMemo(() => {
    const result = generateTrafficAnalysis(arlData, overallData);
    if (onAnalysisComplete) {
      onAnalysisComplete({
        correlation: result.correlation,
        patternSimilarity: result.patternSimilarity,
        anomalies: result.anomalies
      });
    }
    return result;
  }, [arlData, overallData, onAnalysisComplete]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Traffic Analysis Summary</h3>
      
      {/* Volume Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Overall Traffic</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Peak RPM:</span>{' '}
              {analysis.peaks.overall.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Average RPM:</span>{' '}
              {analysis.averages.overall.toLocaleString()}
            </p>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-3">ARL {arlId} Traffic</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Peak RPM:</span>{' '}
              {analysis.peaks.arl.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Average RPM:</span>{' '}
              {analysis.averages.arl.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Traffic Share:</span>{' '}
              {analysis.trafficPercentage}% of total traffic
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Pattern Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm">
              <span className="font-medium">Correlation Score:</span>{' '}
              {analysis.correlation}
              <span className="text-gray-500 ml-2">
                ({analysis.correlation > 0.7 ? 'Strong' : analysis.correlation > 0.4 ? 'Moderate' : 'Weak'} correlation)
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium">Pattern Similarity:</span>{' '}
              {analysis.patternSimilarity}%
            </p>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {analysis.anomalies.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Detected Anomalies</h4>
          <div className="space-y-2">
            {analysis.anomalies.map((anomaly, index) => (
              <div key={index} className="text-sm bg-yellow-50 p-2 rounded">
                <p>
                  <span className="font-medium">Time:</span>{' '}
                  {formatTimestamp(anomaly.timestamp)}
                </p>
                <p>
                  <span className="font-medium">Value:</span>{' '}
                  {anomaly.value.toLocaleString()} RPM
                </p>
                <p>
                  <span className="font-medium">Deviation:</span>{' '}
                  {anomaly.deviation}σ from mean
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="mt-6 bg-blue-50 p-4 rounded">
        <h4 className="font-medium text-gray-700 mb-2">Key Insights</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            ARL {arlId} handles {analysis.trafficPercentage}% of total traffic
          </li>
          <li>
            {analysis.peaks.arl === analysis.peaks.overall ? 
              'ARL peak matches overall traffic peak' : 
              `ARL peak is ${Math.round((analysis.peaks.arl / analysis.peaks.overall) * 100)}% of overall peak`}
          </li>
          <li>
            Traffic patterns show {analysis.correlation > 0.7 ? 'strong' : analysis.correlation > 0.4 ? 'moderate' : 'weak'} correlation
          </li>
          {analysis.anomalies.length > 0 && (
            <li>
              Detected {analysis.anomalies.length} anomalous traffic pattern{analysis.anomalies.length > 1 ? 's' : ''}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TrafficAnalysisSummary;