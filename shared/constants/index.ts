// Agent status constants
export const AGENT_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  ERROR: 'ERROR',
} as const;

// Task type constants
export const TASK_TYPE = {
  RESEARCH: 'RESEARCH',
  CODE_GENERATION: 'CODE_GENERATION',
  ANALYSIS: 'ANALYSIS',
  COMMUNICATION: 'COMMUNICATION',
  MAINTENANCE: 'MAINTENANCE',
} as const;

// Task status constants
export const TASK_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

// Activity type constants
export const ACTIVITY_TYPE = {
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  AGENT_ONLINE: 'AGENT_ONLINE',
  AGENT_OFFLINE: 'AGENT_OFFLINE',
  CONFIG_UPDATED: 'CONFIG_UPDATED',
} as const;

// API routes
export const API_ROUTES = {
  AGENTS: '/api/agents',
  TASKS: '/api/tasks',
  LOGS: '/api/logs',
  METRICS: '/api/metrics',
  HEALTH: '/api/health',
} as const;

// WebSocket paths
export const WS_PATHS = {
  DEFAULT: '/ws',
} as const;

// Agent colors for pixel avatars (fallback colors)
export const AGENT_COLORS = [
  '#e94560', // Red
  '#0f3460', // Blue
  '#ffd700', // Gold
  '#4ade80', // Green
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
] as const;