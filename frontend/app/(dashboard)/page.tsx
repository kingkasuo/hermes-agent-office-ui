'use client';

import { OfficeGrid } from '@/components/pixel-office/OfficeGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { LogStream } from '@/components/dashboard/LogStream';
import { TaskDistribution } from '@/components/dashboard/TaskDistribution';
import { useAgents } from '@/hooks/useAgents';
import { useTasks, useTaskStats } from '@/hooks/useTasks';
import { useWebSocket } from '@/lib/websocket-client';
import {
  Users,
  CheckCircle,
  Clock,
  Activity,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { stats: taskStats, isLoading: statsLoading } = useTaskStats();
  const { isConnected } = useWebSocket();

  const onlineAgents = agents.filter(
    (a) => a.currentStatus === 'ONLINE' || a.currentStatus === 'BUSY'
  ).length;

  const busyAgents = agents.filter((a) => a.currentStatus === 'BUSY').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground mt-1">
            实时监控和管理你的 AI Agent 团队
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
        {agentsLoading ? (
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
              value={`${onlineAgents}/${agents.length}`}
              description={`${busyAgents} 个正在工作中`}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="已完成任务"
              value={taskStats?.completed || 0}
              description="今日总计"
              icon={CheckCircle}
              color="success"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="运行中任务"
              value={taskStats?.running || 0}
              description={`${taskStats?.pending || 0} 个等待中`}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="系统健康度"
              value="98%"
              description="所有服务正常"
              icon={Activity}
              color="success"
            />
          </>
        )}
      </div>

      {/* Office Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">像素办公室</h2>
          {agentsLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="bg-card rounded-lg border min-h-[300px]">
          <OfficeGrid agents={agents} />
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LogStream />
        </div>
        <div>
          {tasksLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <TaskDistribution tasks={tasks} />
          )}
        </div>
      </div>
    </div>
  );
}
