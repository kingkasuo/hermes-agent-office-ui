// 数据验证函数

export function isValidAgentName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{3,50}$/.test(name);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>"']/g, '');
}

export function isValidTaskType(type: string): boolean {
  const validTypes = ['RESEARCH', 'CODE_GENERATION', 'ANALYSIS', 'COMMUNICATION', 'MAINTENANCE'];
  return validTypes.includes(type);
}

export function isValidAgentStatus(status: string): boolean {
  const validStatuses = ['ONLINE', 'OFFLINE', 'BUSY', 'IDLE', 'ERROR'];
  return validStatuses.includes(status);
}
