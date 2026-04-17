'use client';

import { motion } from 'framer-motion';
import type { AgentWithStatus } from '@shared/types/agent';
import { AgentAvatar } from './AgentAvatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { safeJsonParse } from '@/lib/utils';
import {
  AGENT_STATUS_LABELS,
  AGENT_STATUS_COLORS,
} from '@shared/constants/agent-status';

interface WorkstationProps {
  agent: AgentWithStatus;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

export function Workstation({
  agent,
  isSelected = false,
  onClick,
  index = 0,
}: WorkstationProps) {
  const config = safeJsonParse(agent.config, {});
  const color = config.color || '#e94560';
  const status = agent.currentStatus || agent.status;

  const statusVariant = status.toLowerCase() as
    | 'online'
    | 'offline'
    | 'busy'
    | 'idle'
    | 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer group',
        'p-4 rounded-lg border-2 transition-all duration-300',
        'bg-card hover:bg-accent/50',
        isSelected
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Status glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
          status === 'ONLINE' && 'status-glow-online',
          status === 'BUSY' && 'status-glow-busy',
          status === 'OFFLINE' && 'status-glow-offline',
          status === 'ERROR' && 'status-glow-error'
        )}
      />

      <div className="relative flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <AgentAvatar
            name={agent.name}
            status={status}
            color={color}
            size={64}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{agent.displayName}</h3>
            <Badge variant={statusVariant} className="text-xs">
              {AGENT_STATUS_LABELS[status] || status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground truncate">
            @{agent.name}
          </p>

          {agent.metrics && (
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                CPU {agent.metrics.cpu}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                MEM {agent.metrics.memory}MB
              </span>
            </div>
          )}

          {agent.taskCount !== undefined && (
            <div className="mt-1 text-xs text-muted-foreground">
              任务数: {agent.taskCount}
            </div>
          )}
        </div>
      </div>

      {/* Pixel decoration */}
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary/30" />
    </motion.div>
  );
}

export default Workstation;
