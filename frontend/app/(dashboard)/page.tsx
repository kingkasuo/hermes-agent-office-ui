'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Activity, Loader2 } from 'lucide-react';

import { PixelCanvas } from '@/components/pixel-office/PixelCanvas';
import { LogStream } from '@/components/dashboard/LogStream';
import { SystemStatusCard } from '@/components/dashboard/SystemStatusCard';
import { AgentStatsCard } from '@/components/dashboard/AgentStatsCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { PixelAgent } from '../../../shared/types/hermes';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { isConnected, systemState, agents, logs } = useWebSocket();
  const [selectedAgent, setSelectedAgent] = useState<PixelAgent | null>(null);

  const isLoading = !systemState && isConnected;

  // Calculate stats
  const activeAgents = agents.filter(a => a.status !== 'offline').length;
  const workingAgents = agents.filter(a => a.status === 'working').length;
  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const sessionAgents = agents.filter(a => a.type === 'session').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hermes Agent 办公室</h1>
          <p className="text-muted-foreground mt-1">
            实时监控 Hermes Agent 运行状态和活动
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? '实时连接中' : '连接断开'}
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="在线 Agent"
              value={`${activeAgents}/${agents.length}`}
              description={`${workingAgents} 个工作中, ${busyAgents} 个忙碌`}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="活跃会话"
              value={sessionAgents}
              description="当前活跃的会话数量"
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="日志条目"
              value={logs.length}
              description="最近收到的日志数量"
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="系统状态"
              value={systemState?.authStatus === 'authenticated' ? '正常' : '异常'}
              description={systemState?.model?.provider || 'unknown'}
              icon={Activity}
              color={systemState?.authStatus === 'authenticated' ? 'success' : 'destructive'}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pixel Office Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">像素办公室</h2>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-x-auto">
            <PixelCanvas
              agents={agents}
              onAgentClick={setSelectedAgent}
            />
          </div>

          {/* Selected Agent Info */}
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-200">{selectedAgent.displayName}</h3>
                  <p className="text-sm text-slate-400">{selectedAgent.currentActivity?.description || '空闲中'}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-slate-400">消息数: {selectedAgent.metrics.totalMessages}</div>
                  <div className="text-slate-400">状态: <span className="capitalize">{selectedAgent.status}</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SystemStatusCard systemState={systemState} isConnected={isConnected} />
          <AgentStatsCard agents={agents} />
        </div>
      </div>

      {/* Log Stream */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">实时日志</h2>
        <LogStream logs={logs} maxHeight={400} />
      </motion.div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'destructive';
}

function StatCard({ title, value, description, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-blue-500/10 text-blue-500',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    destructive: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
