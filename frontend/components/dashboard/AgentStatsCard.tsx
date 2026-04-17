'use client';

import type { PixelAgent } from '../../../shared/types/hermes';

interface AgentStatsCardProps {
  agents: PixelAgent[];
}

export function AgentStatsCard({ agents }: AgentStatsCardProps) {
  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
      <h3 className="text-sm font-medium text-slate-200 mb-4">Agent 统计</h3>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-slate-500 mb-2">按状态</div>
          <div className="grid grid-cols-2 gap-2">
            {['idle', 'working', 'busy', 'offline', 'error'].map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-400 capitalize">{status}</span>
                <span className="font-medium text-slate-200">{statusCounts[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2">按类型</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="px-2 py-1 bg-slate-800 rounded text-xs">
                <span className="text-slate-400 capitalize">{type}: </span>
                <span className="text-slate-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">总计</span>
            <span className="font-medium text-slate-200">{agents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
