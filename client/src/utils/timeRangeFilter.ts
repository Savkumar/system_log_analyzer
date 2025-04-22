import { TimeRange } from '../types';

/**
 * Filter data based on time range relative to the most recent data point
 */
export const filterByTimeRange = <T extends { timestamp: number }>(
  data: T[],
  range: TimeRange
): T[] => {
  if (range === 'all' || data.length === 0) {
    return data;
  }

  // Get the most recent timestamp from the data
  const latestTimestamp = Math.max(...data.map(item => item.timestamp));

  const rangeMap: Record<TimeRange, number> = {
    '5s': 5,
    '10s': 10,
    '15s': 15,
    '30s': 30,
    '1m': 60,
    '10m': 600,
    '30m': 1800,
    '1h': 3600,
    'all': 0
  };

  const seconds = rangeMap[range];
  if (seconds === 0) return data;

  // Filter based on the time difference from the latest timestamp
  const cutoffTime = latestTimestamp - seconds;
  return data.filter(item => item.timestamp >= cutoffTime);
};