// 日志收集器服务
import { memoryStore } from '../lib/memory-store';
import type { LogEntry, LogLevel } from '../../../shared/types/log';
import { broadcast } from '../lib/websocket-server';

class LogCollector {
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[LogCollector] Started');
  }

  stop() {
    this.isRunning = false;
    console.log('[LogCollector] Stopped');
  }

  addLog(log: LogEntry) {
    memoryStore.addLog(log);

    broadcast({
      type: 'new_log',
      data: { log },
      timestamp: Date.now()
    });
  }

  addSystemLog(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const log: LogEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      metadata,
      timestamp: Date.now(),
      source: 'system'
    };

    this.addLog(log);
  }

  getRecentLogs(limit = 100): LogEntry[] {
    return memoryStore.getRecentLogs(limit);
  }

  getLogsByAgent(agentId: string, limit = 100): LogEntry[] {
    return memoryStore.getLogsByAgent(agentId, limit);
  }
}

export const logCollector = new LogCollector();
