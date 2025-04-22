import { useUnifiedTrafficData } from '../hooks/useUnifiedTrafficData';
import UnifiedTrafficUploader from './UnifiedTrafficUploader';
import OverallTrafficAnalysis from './OverallTrafficAnalysis';
import ARLTrafficAnalysis from './ARLTrafficAnalysis';
import WithoutARLTrafficAnalysis from './WithoutARLTrafficAnalysis';
import CombinedTrafficAnalysis from './CombinedTrafficAnalysis';

interface GhostTrafficAnalysisProps {
  onTrafficAnalysis?: (analysis: {
    correlation: number;
    patternSimilarity: number;
    anomalies: { timestamp: number; value: number; deviation: number }[];
  }) => void;
}

const GhostTrafficAnalysis = ({ onTrafficAnalysis }: GhostTrafficAnalysisProps) => {
  const {
    overallData,
    arlData,
    withoutArlData,
    loading,
    error,
    uploadTrafficData
  } = useUnifiedTrafficData();

  const handleFilesUploaded = (data: {
    overall: { rpm: string; rps: string };
    arl: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => {
    uploadTrafficData(data);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Ghost Traffic Analysis</h1>

      {/* Unified File Upload Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <UnifiedTrafficUploader onFilesUploaded={handleFilesUploaded} />
      </section>

      {/* Combined Traffic Analysis Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Combined Traffic Analysis</h2>
        <CombinedTrafficAnalysis
          overallRPMData={overallData.rpm}
          overallRPSData={overallData.rps}
          arlRPMData={arlData.data.arlRPM}
          arlRPSData={arlData.data.arlRPS}
          loading={loading}
          error={error}
        />
      </section>

      {/* Overall Traffic Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Overall Traffic Pattern</h2>
        <OverallTrafficAnalysis
          rpmData={overallData.rpm}
          rpsData={overallData.rps}
          metrics={overallData.metrics}
          loading={loading}
          error={error}
        />
      </section>

      {/* ARL Traffic Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">ARL Level Traffic Pattern</h2>
        <ARLTrafficAnalysis
          arlRPMData={arlData.data.arlRPM}
          arlRPSData={arlData.data.arlRPS}
          overallRPMData={overallData.rpm}
          overallRPSData={overallData.rps}
          metrics={{
            ...arlData.metrics,
            onAnalysisUpdate: onTrafficAnalysis
          }}
          loading={loading}
          error={error}
        />
      </section>

      {/* Without ARL Traffic Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Traffic Pattern without ARLs</h2>
        <WithoutARLTrafficAnalysis
          rpmData={withoutArlData.rpm}
          rpsData={withoutArlData.rps}
          metrics={withoutArlData.metrics}
          loading={loading}
          error={error}
        />
      </section>
    </div>
  );
};

export default GhostTrafficAnalysis;