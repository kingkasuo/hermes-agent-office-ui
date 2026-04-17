'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentWithStatus } from '@shared/types/agent';
import { AgentAvatar } from './AgentAvatar';
import { Workstation } from './Workstation';
import { cn } from '@/lib/utils';
import { safeJsonParse } from '@/lib/utils';

interface OfficeGridProps {
  agents: AgentWithStatus[];
  onAgentClick?: (agent: AgentWithStatus) => void;
}

export function OfficeGrid({ agents, onAgentClick }: OfficeGridProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStatus | null>(null);

  const handleAgentClick = useCallback((agent: AgentWithStatus) => {
    setSelectedAgent(agent);
    onAgentClick?.(agent);
  }, [onAgentClick]);

  // Calculate grid layout - maximum 4 columns
  const columns = Math.min(4, agents.length);
  const gridCols = `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns}`;

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className={cn("grid gap-6", gridCols)}>
        <AnimatePresence>
          {agents.map((agent, index) => (
            <Workstation
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent?.id === agent.id}
              onClick={() => handleAgentClick(agent)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {agents.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-4">🏢</div>
            <p>办公室空空如也</p>
            <p className="text-sm mt-2">添加一些 Agent 来开始工作</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficeGrid;
