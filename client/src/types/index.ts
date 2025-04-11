export interface LogData {
  timestamp: number;
  cpu_all: number;
  flit: number;
  avg_manager_cycle: number;
  triggered_by_cpu: number;
  arlid: number;
}

export interface OverloadEvent {
  timestamp: number;
  triggered_by_cpu: number;
  arlid: number | null;
  rule: string | null;
  cpu_all: number;
  flit: number;
  avg_manager_cycle: number;
}

export interface DetailedLogEntry {
  timestamp: number;
  http_accepts: number;
  https_accepts: number;
  flit: number;
  cpu_all: number;
  mem_rss: number;
  avg_mgr_cycle: number;
  crp_rule: string;
  crp_arlid: number | null;
  crp_trigger_pct: number;
  crp_deny_pct: number;
  crp_metrics_cpu: number;
  crp_metrics_mem: number;
  crp_metrics_reqs: number;
  crp_triggered_by: string;
  crp_triggered_pct: number;
  time_difference: number;
}

export interface RequestsPerMinute {
  timestamp: string; // Format: "DD Apr HH:MM"
  requests: number;
  date?: Date; // Converted date for easier chart processing
}

export interface RequestsPerSecond {
  timestamp: string; // Format: "DD Apr HH:MM:SS"
  requests: number;
  date?: Date; // Converted date for easier chart processing
}

export interface MetricStat {
  min: number;
  max: number;
  avg: number;
}

export interface Metrics {
  cpu: MetricStat;
  flit: MetricStat;
  cycle: MetricStat;
}

export interface TrafficMetrics {
  maxRPM: number;
  avgRPM: number;
  totalRequests: number;
  maxRPS: number;
  avgRPS: number;
  timespan: string;
}

export interface GhostmonLogEntry {
  timestamp: number;
  formattedTime: string;
  dnsp_key: 'S' | 'W' | string; // S or W typically
  flyteload: number;
  hits: number;
  suspendflag: number;
  suspendlevel: number;
  ocp?: number; // Optional fields
  osp?: number;
  extra?: string; // Any additional data
}

export interface GhostmonMetrics {
  maxFlyteload: number;
  avgFlyteload: number;
  maxHits: number;
  avgHits: number;
  maxSuspendlevel: number;
  timespan: string;
}

export type TimeRange = '5s' | '10s' | '15s' | '30s' | '1m' | '10m' | '30m' | '1h' | 'all';

export interface RPMData {
  timestamp: number;
  requestCount: number;
  formattedTime: string;
}

export interface RPSData {
  timestamp: number;
  requestCount: number;
  formattedTime: string;
}

export interface GhostTrafficData {
  rpm: RPMData[];
  rps: RPSData[];
}

export interface ARLData {
  arlId: number;
  requests: {
    timestamp: number;
    requestCount: number;
    formattedTime: string;
  }[];
}

export interface ARLTrafficData {
  arlRPM: ARLData[];
  arlRPS: ARLData[];
}
