'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MoreHorizontal, Loader2, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/components/pixel-office/AgentAvatar';
import { useAgents, deleteAgent, createAgent } from '@/hooks/useAgents';
import {
  AGENT_STATUS_LABELS,
  DEFAULT_AGENT_COLORS,
} from '@shared/constants/agent-status';
import type { AgentWithStatus } from '@shared/types/agent';
import { safeJsonParse } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AgentsPage() {
  const { agents, isLoading, mutate } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
  });
  const [formError, setFormError] = useState('');

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个 Agent 吗？')) return;
    try {
      await deleteAgent(id);
      mutate();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name.trim()) {
      setFormError('请输入 Agent 名称');
      return;
    }
    if (!formData.displayName.trim()) {
      setFormError('请输入显示名称');
      return;
    }

    // Name format validation (alphanumeric, hyphen, underscore)
    if (!/^[a-z0-9_-]+$/.test(formData.name)) {
      setFormError('Agent 名称只能包含小写字母、数字、连字符和下划线');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAgent({
        name: formData.name.toLowerCase(),
        displayName: formData.displayName,
      });

      // Reset form and close dialog
      setFormData({ name: '', displayName: '' });
      setIsCreateOpen(false);

      // Refresh list
      mutate();
    } catch (error: any) {
      setFormError(error.message || '创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCreateOpen(false);
    setFormData({ name: '', displayName: '' });
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent 管理</h1>
          <p className="text-muted-foreground mt-1">
            管理你的 AI Agent 团队，查看状态和配置
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加 Agent
        </Button>
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索 Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agents Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border rounded-lg"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>任务数</TableHead>
              <TableHead>指标</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  没有找到 Agent
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  onDelete={() => handleDelete(agent.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新 Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Agent 名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如: researcher-1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  只能包含小写字母、数字、连字符和下划线
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  显示名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="例如: 研究员 Alpha"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              {formError && (
                <div className="text-sm text-destructive">{formError}</div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgentRow({
  agent,
  onDelete,
}: {
  agent: AgentWithStatus;
  onDelete: () => void;
}) {
  const config = safeJsonParse(agent.config, {});
  const color = config.color || DEFAULT_AGENT_COLORS[0];
  const status = agent.currentStatus || agent.status;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <AgentAvatar
            name={agent.name}
            status={status}
            color={color}
            size={40}
            isAnimating={false}
          />
          <div>
            <div className="font-medium">{agent.displayName}</div>
            <div className="text-sm text-muted-foreground">@{agent.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={status.toLowerCase() as never}>
          {AGENT_STATUS_LABELS[status] || status}
        </Badge>
      </TableCell>
      <TableCell>{agent.taskCount || 0}</TableCell>
      <TableCell>
        {agent.metrics ? (
          <div className="text-sm space-y-1">
            <div>CPU: {agent.metrics.cpu}%</div>
            <div>MEM: {agent.metrics.memory}MB</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {new Date(agent.createdAt * 1000).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
