'use client';

import { motion } from 'framer-motion';
import { Loader2, Play, Pause, XCircle, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTasks, useTaskStats, updateTask } from '@/hooks/useTasks';
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@shared/constants/task-types';
import type { Task, TaskStatus } from '@shared/types/task';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, CheckCircle2, Clock, X } from 'lucide-react';

export default function TasksPage() {
  const { tasks, isLoading, mutate } = useTasks();
  const { stats, isLoading: statsLoading } = useTaskStats();

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
      mutate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">任务管理</h1>
        <p className="text-muted-foreground mt-1">
          查看和管理所有 Agent 任务
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="总任务"
              value={stats?.total || 0}
              icon={ClipboardList}
              color="primary"
            />
            <StatCard
              title="运行中"
              value={stats?.running || 0}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="已完成"
              value={stats?.completed || 0}
              icon={CheckCircle2}
              color="success"
            />
            <StatCard
              title="失败"
              value={stats?.failed || 0}
              icon={X}
              color="danger"
            />
          </>
        )}
      </div>

      {/* Tasks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border rounded-lg"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务 ID</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>完成时间</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  暂无任务
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}

function TaskRow({
  task,
  onUpdateStatus,
}: {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">
        {task.id.slice(0, 8)}...
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {TASK_TYPE_LABELS[task.type] || task.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          style={{
            backgroundColor: `${TASK_STATUS_COLORS[task.status]}20`,
            color: TASK_STATUS_COLORS[task.status],
            borderColor: `${TASK_STATUS_COLORS[task.status]}40`,
          }}
          variant="outline"
        >
          {TASK_STATUS_LABELS[task.status] || task.status}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(task.createdAt * 1000).toLocaleString()}
      </TableCell>
      <TableCell>
        {task.startedAt
          ? new Date(task.startedAt * 1000).toLocaleString()
          : '-'}
      </TableCell>
      <TableCell>
        {task.completedAt
          ? new Date(task.completedAt * 1000).toLocaleString()
          : '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {task.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateStatus(task.id, 'RUNNING')}
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          {task.status === 'RUNNING' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdateStatus(task.id, 'FAILED')}
              >
                <XCircle className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
