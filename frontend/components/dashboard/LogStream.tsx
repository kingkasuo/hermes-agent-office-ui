'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/lib/websocket-client';
import type { LogEntry } from '@shared/types/log';
import { cn } from '@/lib/utils';

interface LogStreamProps {
  initialLogs?: LogEntry[];
  maxLogs?: number;
}

export function LogStream({ initialLogs = [], maxLogs = 100 }: LogStreamProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { on } = useWebSocket();

  useEffect(() => {
    const unsubscribe = on<LogEntry>('new_log', (log) => {
      setLogs((prev) => [log, ...prev].slice(0, maxLogs));
    });

    return () => unsubscribe();
  }, [on, maxLogs]);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      DEBUG: 'bg-gray-500',
      INFO: 'bg-blue-500',
      WARN: 'bg-amber-500',
      ERROR: 'bg-red-500',
      FATAL: 'bg-red-700',
    };
    return colors[level] || 'bg-gray-500';
  };

  return (
    <Card className="w-full h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          实时日志
          <span className="text-xs text-muted-foreground">({logs.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6" ref={scrollRef}>
          <div className="space-y-2 pb-4">
            <AnimatePresence initial={false}>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded text-sm',
                    index % 2 === 0 ? 'bg-muted/50' : 'bg-transparent'
                  )}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs shrink-0 text-white',
                      getLevelColor(log.level)
                    )}
                  >
                    {log.level}
                  </Badge>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.agentId && (
                    <span className="text-xs text-blue-400 shrink-0">
                      [{log.agentId.slice(0, 8)}]
                    </span>
                  )}
                  <span className="flex-1 truncate">{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                暂无日志
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LogStream;
