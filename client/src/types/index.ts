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

export type TimeRange = '5s' | '10s' | '15s' | '30s' | '1m' | '10m' | '30m' | '1h' | 'all';
