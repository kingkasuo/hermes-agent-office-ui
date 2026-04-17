// Hermes 监控服务 - 定时轮询 + 实时日志流
import { EventEmitter } from 'events';
import type {
  HermesSession,
  HermesMessage,
  HermesLog,
  PixelAgent,
  SystemState,
  AgentChange,
  TaskUpdateData,
} from '../../../shared/types/hermes';
import {
  getHermesStatus,
  getHermesConfig,
  getGatewayStatus,
  getSessions,
  exportSession,
  getInsights,
  createLogStream,
  isHermesInstalled,
} from '../lib/hermes-client';
import { memoryStore } from '../lib/memory-store';

// 监控配置
const MONITOR_CONFIG = {
  system: { interval: 30000 },      // 30s
  gateway: { interval: 30000 },     // 30s
  sessions: { interval: 10000 },    // 10s
  sessionDetails: { interval: 5000 }, // 5s
  insights: { interval: 60000 },    // 60s
};

class MonitorService extends EventEmitter {
  private isRunning = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private logStream: EventEmitter | null = null;
  private hermesInstalled = false;
  private activeSessionIds: Set<string> = new Set();

  // 启动监控服务
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[MonitorService] Starting...');

    // 检查 Hermes 安装
    this.hermesInstalled = await isHermesInstalled();
    if (!this.hermesInstalled) {
      console.warn('[MonitorService] Hermes not installed, monitoring limited');
    } else {
      console.log('[MonitorService] Hermes detected');
    }

    // 初始化系统数据
    await this.updateSystemStatus();
    await this.updateGatewayStatus();
    await this.updateSessions();

    // 启动定时任务
    this.schedule('system', () => this.updateSystemStatus(), MONITOR_CONFIG.system.interval);
    this.schedule('gateway', () => this.updateGatewayStatus(), MONITOR_CONFIG.gateway.interval);
    this.schedule('sessions', () => this.updateSessions(), MONITOR_CONFIG.sessions.interval);
    this.schedule('sessionDetails', () => this.updateSessionDetails(), MONITOR_CONFIG.sessionDetails.interval);
    this.schedule('insights', () => this.updateInsights(), MONITOR_CONFIG.insights.interval);

    // 启动日志流
    if (this.hermesInstalled) {
      this.startLogStream();
    }

    console.log('[MonitorService] Started successfully');
  }

  // 停止监控服务
  stop(): void {
    this.isRunning = false;

    // 清除定时任务
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[MonitorService] Stopped: ${name}`);
    }
    this.intervals.clear();

    // 停止日志流
    if (this.logStream) {
      (this.logStream as any).stop?.();
      this.logStream = null;
    }

    console.log('[MonitorService] Stopped');
  }

  // 调度任务
  private schedule(name: string, fn: () => Promise<void>, interval: number): void {
    // 立即执行一次
    fn().catch(err => console.error(`[MonitorService:${name}] Initial run failed:`, err));

    // 设置定时器
    const timer = setInterval(() => {
      if (!this.isRunning) return;
      fn().catch(err => console.error(`[MonitorService:${name}] Error:`, err));
    }, interval);

    this.intervals.set(name, timer);
  }

  // 更新系统状态
  private async updateSystemStatus(): Promise<void> {
    if (!this.hermesInstalled) return;

    try {
      const [status, config] = await Promise.all([
        getHermesStatus(),
        getHermesConfig(),
      ]);

      const systemState: SystemState = {
        hermesVersion: status.version,
        model: config.model,
        authStatus: status.authStatus,
        components: status.components,
        gatewayStatus: memoryStore.getGatewayStatus() || { running: false, serviceType: 'none', connectedPlatforms: [] },
        timestamp: Date.now(),
      };

      memoryStore.setSystemState(systemState);
      memoryStore.setHermesConfig(config);

      // 推送到前端
      this.emit('system_update', systemState);
    } catch (error) {
      console.error('[MonitorService] Failed to update system status:', error);
    }
  }

  // 更新 Gateway 状态
  private async updateGatewayStatus(): Promise<void> {
    if (!this.hermesInstalled) return;

    try {
      const status = await getGatewayStatus();
      memoryStore.setGatewayStatus(status);

      // 创建 Gateway Agent
      const gatewayAgent: PixelAgent = {
        id: 'gateway-main',
        name: 'gateway-main',
        displayName: 'Gateway Server',
        type: 'gateway',
        position: { x: 0, y: 0, workstationId: 'gateway' },
        status: status.running ? 'working' : 'offline',
        currentActivity: status.running
          ? { type: 'waiting', description: `Platforms: ${status.connectedPlatforms.join(', ') || 'none'}`, startedAt: Date.now() }
          : undefined,
        appearance: {
          color: status.running ? '#4ade80' : '#6b7280',
          avatar: '{}',
          effects: status.running ? ['glow'] : [],
        },
        metrics: {
          totalMessages: 0,
          totalTasks: 0,
          avgResponseTime: 0,
          lastActivity: Date.now(),
        },
      };

      memoryStore.setAgent(gatewayAgent);
    } catch (error) {
      console.error('[MonitorService] Failed to update gateway status:', error);
    }
  }

  // 更新会话列表
  private async updateSessions(): Promise<void> {
    if (!this.hermesInstalled) return;

    try {
      const sessions = await getSessions();

      // 更新内存中的会话
      const currentIds = new Set<string>();
      for (const session of sessions) {
        currentIds.add(session.id);
        memoryStore.setSession(session);

        // 跟踪活跃会话
        if (session.status === 'active') {
          this.activeSessionIds.add(session.id);
        }
      }

      // 清理已删除的会话
      for (const id of this.activeSessionIds) {
        if (!currentIds.has(id)) {
          this.activeSessionIds.delete(id);
          memoryStore.removeSession(id);
        }
      }

      // 映射为 Pixel Agents
      const pixelAgents = this.mapSessionsToPixelAgents(sessions);

      // 添加 Gateway Agent
      const gatewayAgent = memoryStore.getAgent('gateway-main');
      if (gatewayAgent) {
        pixelAgents.push(gatewayAgent);
      }

      // 检测变化
      const changes = memoryStore.detectAgentChanges(pixelAgents);

      // 更新内存
      for (const agent of pixelAgents) {
        memoryStore.setAgent(agent);
      }

      // 推送到前端
      this.emit('agents_update', { agents: pixelAgents, changes });
    } catch (error) {
      console.error('[MonitorService] Failed to update sessions:', error);
    }
  }

  // 更新会话详情（消息内容）
  private async updateSessionDetails(): Promise<void> {
    if (!this.hermesInstalled || this.activeSessionIds.size === 0) return;

    try {
      for (const sessionId of this.activeSessionIds) {
        const messages = await exportSession(sessionId);

        if (messages.length > 0) {
          // 更新 Agent 状态基于最新消息
          this.updateAgentFromMessages(sessionId, messages);

          // 推送到前端
          this.emit('session_messages', {
            sessionId,
            messages,
            newMessage: messages[messages.length - 1],
          });
        }
      }
    } catch (error) {
      console.error('[MonitorService] Failed to update session details:', error);
    }
  }

  // 更新洞察数据
  private async updateInsights(): Promise<void> {
    if (!this.hermesInstalled) return;

    try {
      const insights = await getInsights(7);
      memoryStore.setInsights(insights);
      this.emit('insights_update', insights);
    } catch (error) {
      console.error('[MonitorService] Failed to update insights:', error);
    }
  }

  // 启动日志流
  private startLogStream(): void {
    try {
      this.logStream = createLogStream({
        follow: true,
        lines: 100,
        level: 'INFO',
      });

      this.logStream.on('log', (log: HermesLog) => {
        // 存储日志
        memoryStore.addHermesLog(log);

        // 推送到前端
        this.emit('log', log);

        // 解析任务更新
        const taskUpdate = this.parseLogToTaskUpdate(log);
        if (taskUpdate) {
          this.emit('task_update', taskUpdate);

          // 更新对应 Agent
          this.updateAgentFromTask(taskUpdate);
        }
      });

      this.logStream.on('error', (error: Error) => {
        console.error('[MonitorService] Log stream error:', error);
      });

      console.log('[MonitorService] Log stream started');
    } catch (error) {
      console.error('[MonitorService] Failed to start log stream:', error);
    }
  }

  // 将会话映射为 Pixel Agents
  private mapSessionsToPixelAgents(sessions: HermesSession[]): PixelAgent[] {
    return sessions.map((session, index) => {
      // 计算工位位置 (3x4 网格)
      const col = (index % 4) + 1; // 跳过第一列给 Gateway
      const row = Math.floor(index / 4);

      // 确定状态
      let status: PixelAgent['status'] = 'idle';
      if (session.status === 'completed') status = 'offline';
      else if (session.messageCount > 0) status = 'working';

      return {
        id: `session-${session.id}`,
        name: session.name,
        displayName: session.title || session.name || `Session ${session.id.slice(0, 8)}`,
        type: 'session',
        position: {
          x: col,
          y: row,
          workstationId: `desk-${index}`,
        },
        status,
        currentActivity: session.status === 'active'
          ? { type: 'typing', description: `${session.messageCount} messages`, startedAt: session.updatedAt }
          : undefined,
        appearance: {
          color: this.getSessionColor(session.source),
          avatar: '{}',
          effects: session.status === 'active' ? ['glow'] : [],
        },
        metrics: {
          totalMessages: session.messageCount,
          totalTasks: 0,
          avgResponseTime: 0,
          lastActivity: session.updatedAt,
        },
        sessionId: session.id,
      };
    });
  }

  // 根据消息更新 Agent
  private updateAgentFromMessages(sessionId: string, messages: HermesMessage[]): void {
    const agent = memoryStore.getAgent(`session-${sessionId}`);
    if (!agent || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage.role === 'user';
    const hasToolCalls = lastMessage.metadata?.toolCalls?.some(t => t.status === 'pending');

    // 更新状态
    if (isUserMessage) {
      agent.status = 'busy';
      agent.currentActivity = {
        type: 'thinking',
        description: 'Thinking...',
        startedAt: lastMessage.timestamp,
      };
    } else if (hasToolCalls) {
      agent.status = 'busy';
      agent.currentActivity = {
        type: 'tool_call',
        description: `Tool: ${lastMessage.metadata?.toolCalls?.[0]?.tool}`,
        startedAt: lastMessage.timestamp,
      };
    } else {
      agent.status = 'idle';
      agent.currentActivity = {
        type: 'waiting',
        description: 'Waiting...',
        startedAt: Date.now(),
      };
    }

    agent.metrics.totalMessages = messages.length;
    agent.metrics.lastActivity = Date.now();

    memoryStore.setAgent(agent);

    // 推送更新
    this.emit('agents_update', {
      agents: memoryStore.getAllAgents(),
      changes: [{
        agentId: agent.id,
        field: 'currentActivity',
        oldValue: null,
        newValue: agent.currentActivity,
        timestamp: Date.now(),
      }],
    });
  }

  // 从日志解析任务更新
  private parseLogToTaskUpdate(log: HermesLog): TaskUpdateData | null {
    const message = log.message.toLowerCase();

    // 提取 session/agent ID
    let agentId: string | undefined;
    const sessionMatch = log.message.match(/session[\s-]([\w-]+)/i);
    if (sessionMatch) {
      agentId = `session-${sessionMatch[1]}`;
    }

    if (!agentId) return null;

    // 解析任务状态
    if (message.includes('executing') || message.includes('running')) {
      return {
        agentId,
        taskType: 'execution',
        status: 'started',
        description: log.message,
      };
    }

    if (message.includes('completed') || message.includes('success')) {
      return {
        agentId,
        taskType: 'execution',
        status: 'completed',
        description: log.message,
      };
    }

    if (message.includes('error') || message.includes('failed')) {
      return {
        agentId,
        taskType: 'execution',
        status: 'failed',
        description: log.message,
      };
    }

    return null;
  }

  // 从任务更新 Agent
  private updateAgentFromTask(task: TaskUpdateData): void {
    const agent = memoryStore.getAgent(task.agentId);
    if (!agent) return;

    switch (task.status) {
      case 'started':
        agent.status = 'working';
        agent.currentActivity = {
          type: 'typing',
          description: task.description,
          startedAt: Date.now(),
        };
        agent.appearance.effects = ['typing'];
        break;

      case 'completed':
        agent.status = 'idle';
        agent.currentActivity = {
          type: 'waiting',
          description: 'Task completed',
          startedAt: Date.now(),
        };
        agent.appearance.effects = ['success_pulse'];
        break;

      case 'failed':
        agent.status = 'error';
        agent.currentActivity = {
          type: 'waiting',
          description: 'Error occurred',
          startedAt: Date.now(),
        };
        agent.appearance.effects = ['alert'];
        break;
    }

    memoryStore.setAgent(agent);
  }

  // 获取会话颜色
  private getSessionColor(source: string): string {
    const colors: Record<string, string> = {
      cli: '#0ea5e9',
      telegram: '#0088cc',
      discord: '#5865f2',
      slack: '#4a154b',
      whatsapp: '#25d366',
    };
    return colors[source] || '#6b7280';
  }

  // 获取统计
  getStats() {
    return {
      isRunning: this.isRunning,
      hermesInstalled: this.hermesInstalled,
      activeSessions: this.activeSessionIds.size,
      intervals: Array.from(this.intervals.keys()),
    };
  }
}

// 导出单例
export const monitorService = new MonitorService();
