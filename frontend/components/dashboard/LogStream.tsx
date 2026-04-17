'use client';

import { useRef, useEffect } from 'react';
import type { HermesLog } from '../../../shared/types/hermes';
import { cn } from '../../lib/utils';

interface LogStreamProps {
  logs: HermesLog[];
  maxHeight?: number;
}

export function LogStream({ logs, maxHeight = 300 }: LogStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400 bg-red-950/30';
      case 'WARN':
        return 'text-yellow-400 bg-yellow-950/30';
      case 'DEBUG':
        return 'text-blue-400 bg-blue-950/30';
      case 'INFO':
      default:
        return 'text-green-400 bg-green-950/30';
    }
  };

  const getComponentColor = (component: string) => {
    switch (component) {
      case 'agent':
        return 'text-cyan-400';
      case 'gateway':
        return 'text-purple-400';
      case 'tools':
        return 'text-orange-400';
      case 'cron':
        return 'text-pink-400';
      case 'cli':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto font-mono text-xs space-y-1 p-2 bg-slate-950 rounded-lg border border-slate-800"
      style={{ maxHeight }}
    >
      {logs.length === 0 ? (
        <div className="text-slate-500 text-center py-4">等待日志...</div>
      ) : (
        logs.slice(0, 100).map((log, index) => (
          <div
            key={log.id || index}
            className="flex items-start gap-2 py-1 px-1 hover:bg-slate-900/50 rounded"
          >
            <span className="text-slate-500 shrink-0">{formatTime(log.timestamp)}</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0', getLevelColor(log.level))}>
              {log.level}
            </span>
            <span className={cn('shrink-0', getComponentColor(log.component))}>
              [{log.component}]
            </span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
