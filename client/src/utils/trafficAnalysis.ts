import { RPMData, RPSData } from '../types';

/**
 * Calculate peak value from traffic data
 */
export const calculatePeak = (data: { requestCount: number }[]): number => {
  return Math.max(...data.map(d => d.requestCount));
};

/**
 * Calculate average value from traffic data
 */
export const calculateAverage = (data: { requestCount: number }[]): number => {
  if (data.length === 0) return 0;
  return Math.round(data.reduce((acc, curr) => acc + curr.requestCount, 0) / data.length);
};

/**
 * Calculate correlation coefficient between two traffic patterns
 */
export const calculateCorrelation = (data1: { requestCount: number }[], data2: { requestCount: number }[]): number => {
  if (data1.length !== data2.length || data1.length === 0) return 0;

  const mean1 = calculateAverage(data1);
  const mean2 = calculateAverage(data2);

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < data1.length; i++) {
    const diff1 = data1[i].requestCount - mean1;
    const diff2 = data2[i].requestCount - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  if (denominator1 === 0 || denominator2 === 0) return 0;
  return numerator / Math.sqrt(denominator1 * denominator2);
};

/**
 * Calculate percentage of total traffic
 */
export const calculateTrafficPercentage = (part: { requestCount: number }[], whole: { requestCount: number }[]): number => {
  const partTotal = part.reduce((acc, curr) => acc + curr.requestCount, 0);
  const wholeTotal = whole.reduce((acc, curr) => acc + curr.requestCount, 0);
  return wholeTotal === 0 ? 0 : Math.round((partTotal / wholeTotal) * 100);
};

/**
 * Detect traffic anomalies (points that deviate significantly from the mean)
 */
export const detectAnomalies = (data: { requestCount: number; timestamp: number }[], stdDevThreshold = 2): {
  timestamp: number;
  value: number;
  deviation: number;
}[] => {
  if (data.length === 0) return [];

  const mean = calculateAverage(data);
  const squaredDiffs = data.map(d => Math.pow(d.requestCount - mean, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((acc, curr) => acc + curr, 0) / data.length);

  return data
    .map(point => {
      const deviation = Math.abs(point.requestCount - mean) / stdDev;
      if (deviation > stdDevThreshold) {
        return {
          timestamp: point.timestamp,
          value: point.requestCount,
          deviation: Number(deviation.toFixed(2))
        };
      }
      return null;
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
};

/**
 * Calculate traffic pattern similarity score
 */
export const calculatePatternSimilarity = (data1: { requestCount: number }[], data2: { requestCount: number }[]): number => {
  if (data1.length !== data2.length || data1.length === 0) return 0;

  // Normalize the data
  const max1 = Math.max(...data1.map(d => d.requestCount));
  const max2 = Math.max(...data2.map(d => d.requestCount));

  const normalized1 = data1.map(d => d.requestCount / max1);
  const normalized2 = data2.map(d => d.requestCount / max2);

  // Calculate mean squared error
  const mse = normalized1.reduce((acc, curr, i) => {
    return acc + Math.pow(curr - normalized2[i], 2);
  }, 0) / normalized1.length;

  // Convert to similarity score (0-100)
  return Math.round((1 - Math.min(mse, 1)) * 100);
};

/**
 * Generate comprehensive traffic analysis
 */
export const generateTrafficAnalysis = (
  arlData: { requestCount: number; timestamp: number }[],
  overallData: { requestCount: number; timestamp: number }[]
) => {
  const peakARL = calculatePeak(arlData);
  const peakOverall = calculatePeak(overallData);
  const avgARL = calculateAverage(arlData);
  const avgOverall = calculateAverage(overallData);
  const correlation = calculateCorrelation(arlData, overallData);
  const trafficPercentage = calculateTrafficPercentage(arlData, overallData);
  const patternSimilarity = calculatePatternSimilarity(arlData, overallData);
  const anomalies = detectAnomalies(arlData);

  return {
    peaks: { arl: peakARL, overall: peakOverall },
    averages: { arl: avgARL, overall: avgOverall },
    correlation: Number(correlation.toFixed(2)),
    trafficPercentage,
    patternSimilarity,
    anomalies
  };
};