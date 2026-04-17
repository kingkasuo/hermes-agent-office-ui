'use client';

import { useMemo } from 'react';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AgentActivity } from '@shared/types/agent';

interface ActivityChartProps {
  activities: AgentActivity[];
  type?: 'bar' | 'line';
}

export function ActivityChart({ activities, type = 'bar' }: ActivityChartProps) {
  const data = useMemo(() => {
    // Group activities by hour
    const hourlyData = new Array(24).fill(0).map((_, i) => ({
      hour: `${i}:00`,
      count: 0,
    }));

    activities.forEach((activity) => {
      const hour = new Date(activity.createdAt * 1000).getHours();
      hourlyData[hour].count++;
    });

    return hourlyData;
  }, [activities]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>24小时活动分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default ActivityChart;
