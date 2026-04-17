// 任务类型常量

export const TASK_TYPES = {
  RESEARCH: 'RESEARCH',
  CODE_GENERATION: 'CODE_GENERATION',
  ANALYSIS: 'ANALYSIS',
  COMMUNICATION: 'COMMUNICATION',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export const TASK_TYPE_LABELS: Record<string, string> = {
  RESEARCH: '研究',
  CODE_GENERATION: '代码生成',
  ANALYSIS: '分析',
  COMMUNICATION: '通信',
  MAINTENANCE: '维护',
};

export const TASK_TYPE_ICONS: Record<string, string> = {
  RESEARCH: '🔍',
  CODE_GENERATION: '💻',
  ANALYSIS: '📊',
  COMMUNICATION: '💬',
  MAINTENANCE: '🔧',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: '#6b7280',
  RUNNING: '#3b82f6',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  CANCELLED: '#9ca3af',
};
