import { useState } from 'react';
import { GhostmonLogEntry, GhostmonMetrics } from '../types';
import { parseGhostmonLog, filterByDnspKey, calculateGhostmonMetrics } from '../utils/ghostmonParser';

interface UseGhostmonDataReturn {
  logEntries: GhostmonLogEntry[];
  filteredEntries: GhostmonLogEntry[];
  metrics: GhostmonMetrics;
  loading: boolean;
  error: string | null;
  activeFilter: 'S' | 'W' | 'all';
  setActiveFilter: (filter: 'S' | 'W' | 'all') => void;
  uploadGhostmonLog: (logContent: string) => void;
}

export function useGhostmonData(): UseGhostmonDataReturn {
  const [logEntries, setLogEntries] = useState<GhostmonLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GhostmonLogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<'S' | 'W' | 'all'>('all');
  const [metrics, setMetrics] = useState<GhostmonMetrics>({
    maxFlyteload: 0,
    avgFlyteload: 0,
    maxHits: 0,
    avgHits: 0,
    maxSuspendlevel: 0,
    timespan: 'N/A'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const applyFilter = (entries: GhostmonLogEntry[], filter: 'S' | 'W' | 'all') => {
    if (filter === 'all') {
      return entries;
    }
    return filterByDnspKey(entries, filter);
  };

  const uploadGhostmonLog = (logContent: string) => {
    try {
      setLoading(true);
      setError(null);

      // Parse the log data
      const parsedEntries = parseGhostmonLog(logContent);
      setLogEntries(parsedEntries);

      // Apply the current filter
      const filtered = applyFilter(parsedEntries, activeFilter);
      setFilteredEntries(filtered);

      // Calculate metrics based on filtered data
      const computedMetrics = calculateGhostmonMetrics(filtered);
      setMetrics(computedMetrics);

      setLoading(false);
    } catch (err) {
      setError(`Error parsing ghostmon log data: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filter: 'S' | 'W' | 'all') => {
    setActiveFilter(filter);
    
    // Apply the new filter to existing data
    const filtered = applyFilter(logEntries, filter);
    setFilteredEntries(filtered);
    
    // Recalculate metrics
    const computedMetrics = calculateGhostmonMetrics(filtered);
    setMetrics(computedMetrics);
  };

  return {
    logEntries,
    filteredEntries,
    metrics,
    loading,
    error,
    activeFilter,
    setActiveFilter: handleFilterChange,
    uploadGhostmonLog
  };
}