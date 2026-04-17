// Hermes CLI 客户端 - 执行 hermes 命令并解析输出
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  HermesStatus,
  HermesLog,
  HermesSession,
  HermesInsights,
} from '../../../shared/types/hermes';

const execAsync = promisify(exec);

// 命令执行配置
const EXEC_TIMEOUT = 30000; // 30秒超时
const MAX_BUFFER = 1024 * 1024; // 1MB 缓冲区

/**
 * 执行 hermes 命令
 * @param args 命令参数
 * @returns 命令输出
 */
async function execHermesCommand(args: string): Promise<string> {
  const command = `hermes ${args}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_BUFFER,
      env: {
        ...process.env,
        // 确保 hermes 可以找到
        PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
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
 * 获取 Hermes 状态
 * 执行: hermes status
 */
export async function getHermesStatus(): Promise<HermesStatus> {
  try {
    const output = await execHermesCommand('status');

    // 解析状态输出
    const status: HermesStatus = {
      version: '',
      configLoaded: false,
      authStatus: 'unknown',
      modelProvider: '',
      gatewayRunning: false,
      components: {},
      timestamp: Date.now(),
    };

    // 解析输出行
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // 版本信息
      if (trimmed.startsWith('Version:')) {
        status.version = trimmed.split(':')[1]?.trim() || '';
      }
      // 配置加载状态
      else if (trimmed.includes('config') && trimmed.includes('loaded')) {
        status.configLoaded = !trimmed.toLowerCase().includes('not');
      }
      // 认证状态
      else if (trimmed.includes('auth') || trimmed.includes('logged in')) {
        status.authStatus = trimmed.toLowerCase().includes('not')
          ? 'not_authenticated'
          : 'authenticated';
      }
      // 模型提供商
      else if (trimmed.includes('model') || trimmed.includes('provider')) {
        const match = trimmed.match(/provider[:\s]+(\w+)/i);
        if (match) status.modelProvider = match[1];
      }
      // Gateway 状态
      else if (trimmed.includes('gateway')) {
        status.gatewayRunning = trimmed.toLowerCase().includes('running');
      }
    }

    // 尝试解析 JSON 格式输出（如果支持）
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        Object.assign(status, jsonData);
      }
    } catch {
      // 忽略 JSON 解析错误，使用文本解析
    }

    return status;
  } catch (error) {
    console.error('[HermesClient] Failed to get status:', error);
    return {
      version: 'unknown',
      configLoaded: false,
      authStatus: 'error',
      modelProvider: '',
      gatewayRunning: false,
      components: {},
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 获取 Hermes 日志
 * 执行: hermes logs [options]
 * @param options 日志选项
 */
export async function getHermesLogs(options?: {
  lines?: number;
  follow?: boolean;
  since?: string; // e.g., '1h', '30m', '1d'
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}): Promise<HermesLog[]> {
  try {
    let args = 'logs';

    if (options?.lines) {
      args += ` -n ${options.lines}`;
    }

    if (options?.since) {
      args += ` --since ${options.since}`;
    }

    const output = await execHermesCommand(args);
    const logs: HermesLog[] = [];

    // 解析日志行
    // 格式示例: 2024-01-15 10:30:45 [INFO] Message content
    const lines = output.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      const log = parseLogLine(line);
      if (log) {
        // 过滤级别
        if (options?.level && log.level !== options.level) {
          continue;
        }
        logs.push(log);
      }
    }

    return logs;
  } catch (error) {
    console.error('[HermesClient] Failed to get logs:', error);
    return [];
  }
}

/**
 * 解析单行日志
 */
function parseLogLine(line: string): HermesLog | null {
  // 尝试匹配常见日志格式
  const patterns = [
    // 格式: 2024-01-15 10:30:45 [INFO] Message
    /^(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\s*\[(\w+)\]\s*(.+)$/,
    // 格式: [2024-01-15 10:30:45] [INFO] Message
    /^\[(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\]\s*\[(\w+)\]\s*(.+)$/,
    // 格式: INFO 2024-01-15 10:30:45 Message
    /^(\w+)\s+(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\s*(.+)$/,
    // 简单格式: [INFO] Message
    /^\[(\w+)\]\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let timestamp: number;
      let level: string;
      let message: string;

      if (match.length === 4) {
        // 有时间戳和级别
        const dateStr = match[1].includes('-') ? match[1] : match[2];
        level = match[1].includes('-') ? match[2] : match[1];
        message = match[3];
        timestamp = new Date(dateStr).getTime() || Date.now();
      } else {
        // 只有级别和消息
        level = match[1];
        message = match[2];
        timestamp = Date.now();
      }

      return {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp,
        level: normalizeLogLevel(level),
        message: message.trim(),
        source: 'hermes',
        raw: line,
      };
    }
  }

  // 无法解析，作为普通信息日志
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    level: 'INFO',
    message: line.trim(),
    source: 'hermes',
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
  if (upper.includes('ERROR') || upper.includes('FATAL')) return 'ERROR';
  return 'INFO';
}

/**
 * 获取 Hermes 会话列表
 * 执行: hermes sessions list
 */
export async function getHermesSessions(): Promise<HermesSession[]> {
  try {
    const output = await execHermesCommand('sessions list');
    const sessions: HermesSession[] = [];

    const lines = output.split('\n').filter((line) => line.trim());

    for (const line of lines) {
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
  // 尝试解析表格格式或列表格式
  // 示例: ID    Name    Created    Messages
  //       abc   test    2024-01-15 45

  const parts = line.trim().split(/\s{2,}/); // 2+ 空格分隔

  if (parts.length >= 2) {
    const id = parts[0];
    const name = parts[1] || 'Untitled';
    const createdAt = parts[2] ? new Date(parts[2]).getTime() : Date.now();
    const messageCount = parseInt(parts[3], 10) || 0;

    return {
      id,
      name,
      createdAt,
      updatedAt: createdAt,
      messageCount,
      status: 'active',
    };
  }

  return null;
}

/**
 * 获取 Hermes 使用洞察
 * 执行: hermes insights
 */
export async function getHermesInsights(): Promise<HermesInsights> {
  try {
    const output = await execHermesCommand('insights');

    const insights: HermesInsights = {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      usageByProvider: {},
      topSkills: [],
      period: '7d',
      timestamp: Date.now(),
    };

    const lines = output.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      // 解析各类指标
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
      period: '7d',
      timestamp: Date.now(),
    };
  }
}

/**
 * 获取当前活跃的 hermes 进程信息
 */
export async function getActiveHermesProcesses(): Promise<
  Array<{
    pid: string;
    command: string;
    startTime: string;
  }>
> {
  try {
    const { stdout } = await execAsync(
      "ps aux | grep -i hermes | grep -v grep || true",
      { timeout: 5000 }
    );

    const processes: Array<{
      pid: string;
      command: string;
      startTime: string;
    }> = [];

    const lines = stdout.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10) {
        processes.push({
          pid: parts[1],
          startTime: parts[8] || parts[9] || 'unknown',
          command: parts.slice(10).join(' '),
        });
      }
    }

    return processes;
  } catch {
    return [];
  }
}

/**
 * 检查 hermes 是否已安装
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
 * 获取 hermes 版本
 */
export async function getHermesVersion(): Promise<string> {
  try {
    const output = await execHermesCommand('--version');
    return output.trim() || 'unknown';
  } catch {
    return 'not_installed';
  }
}
