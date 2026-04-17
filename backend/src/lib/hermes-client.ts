// Hermes CLI 客户端 - 执行 hermes 命令并解析输出
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import type {
  HermesSystemStatus,
  HermesConfig,
  GatewayStatus,
  Gateway,
  HermesSession,
  HermesSessionDetail,
  HermesMessage,
  HermesLog,
  HermesInsights,
  AuthProvider,
  ModelInfo,
  LogStreamOptions,
} from '../../../shared/types/hermes';

const execAsync = promisify(exec);

// 命令执行配置
const EXEC_TIMEOUT = 30000;
const MAX_BUFFER = 1024 * 1024;

/**
 * 执行 hermes 命令
 */
async function execHermesCommand(args: string): Promise<string> {
  const command = `hermes ${args}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_BUFFER,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH}`,
      },
    });

    if (stderr && !stdout) {
      console.warn(`[HermesClient] Command warning: ${stderr}`);
    }

    return stdout || '';
  } catch (error: any) {
    console.error(`[HermesClient] Command failed: ${command}`, error.message);
    throw new Error(`Hermes command failed: ${error.message}`);
  }
}

/**
 * 获取 Hermes 系统状态
 */
export async function getHermesStatus(): Promise<HermesSystemStatus> {
  try {
    const output = await execHermesCommand('status');

    const status: HermesSystemStatus = {
      version: '',
      configLoaded: false,
      authStatus: 'unknown',
      timestamp: Date.now(),
      components: {
        cli: false,
        gateway: false,
        cron: false,
        memory: false,
      },
    };

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.includes('version')) {
        const match = line.match(/version[:\s]+([\d.]+)/i);
        if (match) status.version = match[1];
      } else if (trimmed.includes('config') && trimmed.includes('loaded')) {
        status.configLoaded = !trimmed.includes('not');
      } else if (trimmed.includes('auth') || trimmed.includes('authenticated')) {
        status.authStatus = trimmed.includes('not') || trimmed.includes('unauthenticated')
          ? 'not_authenticated'
          : 'authenticated';
      } else if (trimmed.includes('cli')) {
        status.components.cli = trimmed.includes('ok') || trimmed.includes('running');
      } else if (trimmed.includes('gateway')) {
        status.components.gateway = trimmed.includes('ok') || trimmed.includes('running');
      } else if (trimmed.includes('cron')) {
        status.components.cron = trimmed.includes('ok') || trimmed.includes('running');
      } else if (trimmed.includes('memory')) {
        status.components.memory = trimmed.includes('ok') || trimmed.includes('configured');
      }
    }

    return status;
  } catch (error) {
    console.error('[HermesClient] Failed to get status:', error);
    return {
      version: 'unknown',
      configLoaded: false,
      authStatus: 'error',
      timestamp: Date.now(),
      components: { cli: false, gateway: false, cron: false, memory: false },
    };
  }
}

/**
 * 获取 Hermes 配置
 */
export async function getHermesConfig(): Promise<HermesConfig> {
  try {
    const output = await execHermesCommand('config show');

    const config: HermesConfig = {
      model: {
        provider: 'unknown',
        modelName: 'unknown',
        maxTokens: 200000,
      },
      toolsets: [],
      features: {
        voiceMode: false,
        compression: true,
        promptCaching: true,
      },
      personalities: [],
    };

    const lines = output.split('\n');
    let inModelSection = false;
    let inFeaturesSection = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.includes('model:') || trimmed.includes('provider:')) {
        inModelSection = true;
        const match = line.match(/provider[:\s]+(\w+)/i);
        if (match) config.model.provider = match[1];
      } else if (trimmed.includes('model name:') || trimmed.includes('model:')) {
        const match = line.match(/model[:\s]+([\w\-./]+)/i);
        if (match) config.model.modelName = match[1];
      } else if (trimmed.includes('max_tokens:') || trimmed.includes('max tokens:')) {
        const match = line.match(/(\d+)/);
        if (match) config.model.maxTokens = parseInt(match[1], 10);
      } else if (trimmed.includes('features:')) {
        inFeaturesSection = true;
        inModelSection = false;
      } else if (trimmed.includes('toolsets:') || trimmed.includes('tools:')) {
        const match = line.match(/[:\s]+([\w,\s]+)/i);
        if (match) {
          config.toolsets = match[1].split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (trimmed.includes('voice')) {
        config.features.voiceMode = trimmed.includes('true') || trimmed.includes('enabled');
      } else if (trimmed.includes('compression')) {
        config.features.compression = !trimmed.includes('false') && !trimmed.includes('disabled');
      }
    }

    return config;
  } catch (error) {
    console.error('[HermesClient] Failed to get config:', error);
    return {
      model: { provider: 'unknown', modelName: 'unknown', maxTokens: 200000 },
      toolsets: [],
      features: { voiceMode: false, compression: true, promptCaching: true },
      personalities: [],
    };
  }
}

/**
 * 获取 Gateway 状态
 */
export async function getGatewayStatus(): Promise<GatewayStatus> {
  try {
    const output = await execHermesCommand('gateway status');

    const status: GatewayStatus = {
      running: false,
      serviceType: 'none',
      connectedPlatforms: [],
    };

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.includes('status') || trimmed.includes('running')) {
        status.running = trimmed.includes('running') || trimmed.includes('active');
      } else if (trimmed.includes('service')) {
        if (trimmed.includes('systemd')) status.serviceType = 'systemd';
        else if (trimmed.includes('launchd')) status.serviceType = 'launchd';
        else if (trimmed.includes('foreground')) status.serviceType = 'foreground';
      } else if (trimmed.includes('platform')) {
        const match = line.match(/[:\s]+([\w,\s]+)/i);
        if (match) {
          status.connectedPlatforms = match[1].split(',').map(p => p.trim()).filter(Boolean);
        }
      }
    }

    return status;
  } catch (error) {
    console.error('[HermesClient] Failed to get gateway status:', error);
    return { running: false, serviceType: 'none', connectedPlatforms: [] };
  }
}

/**
 * 获取会话列表
 */
export async function getSessions(): Promise<HermesSession[]> {
  try {
    const output = await execHermesCommand('sessions list');
    const sessions: HermesSession[] = [];

    const lines = output.split('\n').filter(line => line.trim());
    let isTableHeader = true;

    for (const line of lines) {
      // 跳过表头行
      if (isTableHeader) {
        if (line.includes('---') || line.includes('ID')) {
          isTableHeader = false;
        }
        continue;
      }

      const session = parseSessionLine(line);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  } catch (error) {
    console.error('[HermesClient] Failed to get sessions:', error);
    return [];
  }
}

/**
 * 解析会话行
 */
function parseSessionLine(line: string): HermesSession | null {
  // 尝试多种格式解析
  // 格式1: ID    Name    Created    Messages  Status
  const parts = line.trim().split(/\s{2,}/);

  if (parts.length >= 2) {
    const id = parts[0].trim();
    const name = parts[1]?.trim() || 'Untitled';
    const createdStr = parts[2];
    const messageCount = parseInt(parts[3], 10) || 0;
    const statusStr = parts[4]?.toLowerCase() || 'active';

    const createdAt = createdStr ? new Date(createdStr).getTime() || Date.now() : Date.now();

    return {
      id,
      name,
      createdAt,
      updatedAt: createdAt,
      messageCount,
      status: statusStr.includes('active') ? 'active' : statusStr.includes('pause') ? 'paused' : 'completed',
      source: 'cli',
    };
  }

  return null;
}

/**
 * 导出会话消息
 */
export async function exportSession(sessionId: string): Promise<HermesMessage[]> {
  try {
    const output = await execHermesCommand(`sessions export ${sessionId}`);
    const messages: HermesMessage[] = [];

    try {
      // 尝试解析 JSONL 格式
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          messages.push({
            id: msg.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sessionId,
            role: msg.role || 'assistant',
            content: msg.content || '',
            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
            metadata: {
              model: msg.model,
              tokens: msg.tokens,
              toolCalls: msg.tool_calls,
            },
          });
        } catch {
          // 忽略无法解析的行
        }
      }
    } catch {
      // 如果不是 JSON，尝试文本解析
      return parseTextMessages(output, sessionId);
    }

    return messages;
  } catch (error) {
    console.error('[HermesClient] Failed to export session:', error);
    return [];
  }
}

/**
 * 解析文本格式的消息
 */
function parseTextMessages(output: string, sessionId: string): HermesMessage[] {
  const messages: HermesMessage[] = [];
  const lines = output.split('\n');

  let currentRole: 'user' | 'assistant' | 'system' = 'assistant';
  let currentContent = '';
  let timestamp = Date.now();

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('User:') || trimmed.startsWith('user:')) {
      if (currentContent) {
        messages.push({
          id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
          sessionId,
          role: currentRole,
          content: currentContent.trim(),
          timestamp,
        });
      }
      currentRole = 'user';
      currentContent = trimmed.replace(/^user:/i, '').trim();
    } else if (trimmed.startsWith('Assistant:') || trimmed.startsWith('assistant:')) {
      if (currentContent) {
        messages.push({
          id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
          sessionId,
          role: currentRole,
          content: currentContent.trim(),
          timestamp,
        });
      }
      currentRole = 'assistant';
      currentContent = trimmed.replace(/^assistant:/i, '').trim();
    } else {
      currentContent += '\n' + trimmed;
    }
  }

  if (currentContent) {
    messages.push({
      id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      role: currentRole,
      content: currentContent.trim(),
      timestamp,
    });
  }

  return messages;
}

/**
 * 获取洞察数据
 */
export async function getInsights(days = 7): Promise<HermesInsights> {
  try {
    const output = await execHermesCommand(`insights --days ${days}`);

    const insights: HermesInsights = {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      usageByProvider: {},
      topSkills: [],
      period: `${days}d`,
      timestamp: Date.now(),
    };

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.toLowerCase();

      if (trimmed.includes('session')) {
        const match = line.match(/(\d+)/);
        if (match) insights.totalSessions = parseInt(match[1], 10);
      } else if (trimmed.includes('message')) {
        const match = line.match(/(\d+)/);
        if (match) insights.totalMessages = parseInt(match[1], 10);
      } else if (trimmed.includes('token')) {
        const match = line.match(/(\d+)/);
        if (match) insights.totalTokens = parseInt(match[1], 10);
      }
    }

    return insights;
  } catch (error) {
    console.error('[HermesClient] Failed to get insights:', error);
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      usageByProvider: {},
      topSkills: [],
      period: `${days}d`,
      timestamp: Date.now(),
    };
  }
}

/**
 * 获取认证提供商
 */
export async function getAuthProviders(): Promise<AuthProvider[]> {
  try {
    const output = await execHermesCommand('auth list');
    const providers: AuthProvider[] = [];

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes('---')) continue;

      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 2) {
        providers.push({
          name: parts[0].trim(),
          type: parts[1]?.toLowerCase().includes('oauth') ? 'oauth' : 'api_key',
          status: trimmed.includes('active') || trimmed.includes('ok') ? 'active' : 'error',
        });
      }
    }

    return providers;
  } catch (error) {
    console.error('[HermesClient] Failed to get auth providers:', error);
    return [];
  }
}

/**
 * 获取当前模型
 */
export async function getCurrentModel(): Promise<ModelInfo> {
  try {
    const config = await getHermesConfig();
    return config.model;
  } catch (error) {
    console.error('[HermesClient] Failed to get current model:', error);
    return { provider: 'unknown', modelName: 'unknown', maxTokens: 200000 };
  }
}

/**
 * 获取 Hermes 版本
 */
export async function getHermesVersion(): Promise<string> {
  try {
    const output = await execHermesCommand('--version');
    return output.trim() || 'unknown';
  } catch {
    return 'not_installed';
  }
}

/**
 * 检查 Hermes 是否已安装
 */
export async function isHermesInstalled(): Promise<boolean> {
  try {
    await execHermesCommand('--version');
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取日志（一次性）
 */
export async function getLogs(options?: LogStreamOptions): Promise<HermesLog[]> {
  try {
    let args = 'logs';

    if (options?.lines) {
      args += ` -n ${options.lines}`;
    }

    if (options?.since) {
      args += ` --since ${options.since}`;
    }

    if (options?.level) {
      args += ` --level ${options.level}`;
    }

    if (options?.component) {
      args += ` --component ${options.component}`;
    }

    const output = await execHermesCommand(args);
    return parseLogs(output);
  } catch (error) {
    console.error('[HermesClient] Failed to get logs:', error);
    return [];
  }
}

/**
 * 解析日志输出
 */
function parseLogs(output: string): HermesLog[] {
  const logs: HermesLog[] = [];
  const lines = output.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const log = parseLogLine(line);
    if (log) {
      logs.push(log);
    }
  }

  return logs;
}

/**
 * 解析单行日志
 */
function parseLogLine(line: string): HermesLog | null {
  const patterns = [
    // 格式: 2024-01-15 10:30:45 [INFO] [component] Message
    /^(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\s*\[(\w+)\]\s*(?:\[(\w+)\])?\s*(.+)$/,
    // 格式: [2024-01-15 10:30:45] [INFO] Message
    /^\[(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\]\s*\[(\w+)\]\s*(.+)$/,
    // 简单格式: [INFO] Message
    /^\[(\w+)\]\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let timestamp: number;
      let level: string;
      let component = 'system';
      let message: string;

      if (match.length === 5) {
        // 有时间戳、级别、组件和消息
        timestamp = new Date(match[1]).getTime() || Date.now();
        level = match[2];
        component = match[3] || 'system';
        message = match[4];
      } else if (match.length === 4) {
        if (match[1].includes('-')) {
          // 有时间戳和级别
          timestamp = new Date(match[1]).getTime() || Date.now();
          level = match[2];
          message = match[3];
        } else {
          // 有级别，无时间戳
          level = match[1];
          message = match[2];
          timestamp = Date.now();
        }
      } else {
        level = match[1];
        message = match[2];
        timestamp = Date.now();
      }

      return {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp,
        level: normalizeLogLevel(level),
        component: normalizeComponent(component),
        message: message.trim(),
        raw: line,
      };
    }
  }

  // 无法解析，作为普通信息日志
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    level: 'INFO',
    component: 'system',
    message: line.trim(),
    raw: line,
  };
}

/**
 * 标准化日志级别
 */
function normalizeLogLevel(level: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' {
  const upper = level.toUpperCase();
  if (upper.includes('DEBUG')) return 'DEBUG';
  if (upper.includes('INFO')) return 'INFO';
  if (upper.includes('WARN')) return 'WARN';
  if (upper.includes('ERROR') || upper.includes('FATAL') || upper.includes('CRITICAL')) return 'ERROR';
  return 'INFO';
}

/**
 * 标准化组件名称
 */
function normalizeComponent(component: string): 'agent' | 'gateway' | 'cli' | 'tools' | 'cron' | 'system' {
  const lower = component.toLowerCase();
  if (lower.includes('agent')) return 'agent';
  if (lower.includes('gateway')) return 'gateway';
  if (lower.includes('cli')) return 'cli';
  if (lower.includes('tool')) return 'tools';
  if (lower.includes('cron')) return 'cron';
  return 'system';
}

/**
 * 创建日志流（实时）
 */
export function createLogStream(options: LogStreamOptions = {}): EventEmitter {
  const emitter = new EventEmitter();

  let args = ['logs'];

  if (options.follow) {
    args.push('-f');
  }

  if (options.lines) {
    args.push('-n', options.lines.toString());
  }

  if (options.level) {
    args.push('--level', options.level);
  }

  if (options.component) {
    args.push('--component', options.component);
  }

  const child = spawn('hermes', args, {
    env: {
      ...process.env,
      PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH}`,
    },
  });

  let buffer = '';

  child.stdout.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留未完成的行

    for (const line of lines) {
      const log = parseLogLine(line);
      if (log) {
        emitter.emit('log', log);
      }
    }
  });

  child.stderr.on('data', (data: Buffer) => {
    console.warn('[HermesClient] Log stream stderr:', data.toString());
  });

  child.on('close', (code) => {
    emitter.emit('close', code);
  });

  child.on('error', (error) => {
    emitter.emit('error', error);
  });

  // 提供停止方法
  (emitter as any).stop = () => {
    child.kill();
  };

  return emitter;
}
