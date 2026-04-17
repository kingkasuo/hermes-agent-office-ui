// API 路由常量 (不含 /api 前缀，因为 API_BASE 已包含)

export const API_ROUTES = {
  // Agent API
  AGENTS: '/agents',
  AGENT_BY_ID: (id: string) => `/agents/${id}`,
  AGENT_STATUS: (id: string) => `/agents/${id}/status`,
  AGENT_METRICS: (id: string) => `/agents/${id}/metrics`,
  AGENT_ACTIVITIES: (id: string) => `/agents/${id}/activities`,

  // Task API
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_STATS: '/tasks/stats',

  // Log API
  LOGS: '/logs',
  LOG_STATS: '/logs/stats',

  // System API
  HEALTH: '/health',
  STATS: '/stats',

  // Hermes API
  HERMES_STATUS: '/hermes/status',
  HERMES_LOGS: '/hermes/logs',
  HERMES_INSIGHTS: '/hermes/insights',
} as const;

export const WS_ROUTES = {
  CONNECT: '/ws',
} as const;
