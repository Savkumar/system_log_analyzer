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
