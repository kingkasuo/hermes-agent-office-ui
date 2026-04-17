// Agent 状态常量

export const AGENT_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  ERROR: 'ERROR',
} as const;

export const AGENT_STATUS_LABELS: Record<string, string> = {
  ONLINE: '在线',
  OFFLINE: '离线',
  BUSY: '忙碌',
  IDLE: '空闲',
  ERROR: '错误',
};

export const AGENT_STATUS_COLORS: Record<string, string> = {
  ONLINE: '#4ade80',
  OFFLINE: '#6b7280',
  BUSY: '#f59e0b',
  IDLE: '#3b82f6',
  ERROR: '#ef4444',
};

export const DEFAULT_AGENT_COLORS = [
  '#e94560',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];
