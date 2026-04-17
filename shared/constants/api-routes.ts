// API 路由常量

export const API_ROUTES = {
  // Agent API
  AGENTS: '/api/agents',
  AGENT_BY_ID: (id: string) => `/api/agents/${id}`,
  AGENT_STATUS: (id: string) => `/api/agents/${id}/status`,
  AGENT_METRICS: (id: string) => `/api/agents/${id}/metrics`,
  AGENT_ACTIVITIES: (id: string) => `/api/agents/${id}/activities`,

  // Task API
  TASKS: '/api/tasks',
  TASK_BY_ID: (id: string) => `/api/tasks/${id}`,
  TASK_STATS: '/api/tasks/stats',

  // Log API
  LOGS: '/api/logs',
  LOG_STATS: '/api/logs/stats',

  // System API
  HEALTH: '/api/health',
  STATS: '/api/stats',
} as const;

export const WS_ROUTES = {
  CONNECT: '/ws',
} as const;
