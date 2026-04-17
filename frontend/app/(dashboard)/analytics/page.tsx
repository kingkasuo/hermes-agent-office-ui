'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  TrendingUp,
  Clock,
  Target,
  Activity,
} from 'lucide-react';

// Mock data
const performanceData = [
  { name: '周一', tasks: 45, success: 42, fail: 3 },
  { name: '周二', tasks: 52, success: 48, fail: 4 },
  { name: '周三', tasks: 38, success: 36, fail: 2 },
  { name: '周四', tasks: 65, success: 60, fail: 5 },
  { name: '周五', tasks: 48, success: 45, fail: 3 },
  { name: '周六', tasks: 25, success: 24, fail: 1 },
  { name: '周日', tasks: 30, success: 28, fail: 2 },
];

const agentPerformanceData = [
  { name: '研究员 Alpha', tasks: 156, success: 148 },
  { name: '程序员 Beta', tasks: 142, success: 135 },
  { name: '分析师 Gamma', tasks: 128, success: 125 },
  { name: '助手 Delta', tasks: 98, success: 96 },
];

const taskTypeData = [
  { name: '研究', value: 35 },
  { name: '代码生成', value: 28 },
  { name: '分析', value: 22 },
  { name: '通信', value: 10 },
  { name: '维护', value: 5 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">数据分析</h1>
        <p className="text-muted-foreground mt-1">
          查看 Agent 团队性能指标和任务统计
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="周任务完成率"
          value="94.2%"
          description="较上周 +2.1%"
          icon={Target}
          color="success"
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatCard
          title="平均响应时间"
          value="1.2s"
          description="较上周 -0.3s"
          icon={Clock}
          color="primary"
          trend={{ value: 20, isPositive: true }}
        />
        <StatCard
          title="总处理任务"
          value="301"
          description="本周累计"
          icon={Activity}
          color="warning"
        />
        <StatCard
          title="效率指数"
          value="8.7"
          description="满分 10 分"
          icon={TrendingUp}
          color="success"
          trend={{ value: 5.2, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>周任务趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="success" name="成功" fill="#10b981" />
                  <Bar dataKey="fail" name="失败" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agent Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Agent 绩效排名</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={agentPerformanceData}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="tasks" name="总任务" fill="#3b82f6" />
                  <Bar dataKey="success" name="成功" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>任务类型占比</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Rate Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>成功率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) =>
                      `${((value as number) * 100 / 70).toFixed(1)}%`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
