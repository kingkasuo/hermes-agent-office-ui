// 日志相关类型定义

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id: string;
  agentId?: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  source?: string;
}

export interface LogFilter {
  agentId?: string;
  level?: LogLevel;
  startTime?: number;
  endTime?: number;
  search?: string;
  source?: string;
}

export interface LogQueryResult {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

export interface LogStats {
  totalCount: number;
  byLevel: Record<LogLevel, number>;
  byAgent: Record<string, number>;
  recentErrors: LogEntry[];
}
