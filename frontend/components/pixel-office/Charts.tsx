'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

// Canvas-based pixel chart component
interface PixelChartProps {
  data: number[];
  maxValue?: number;
  color: string;
  height?: number;
  label?: string;
}

function PixelChart({ data, maxValue = 100, color, height = 60, label }: PixelChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const chartHeight = canvas.height;

    // Clear with theme color
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pixel-bg-secondary').trim() || 'rgba(26, 26, 46, 0.8)';
    ctx.fillRect(0, 0, width, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw data bars (pixel style)
    const barWidth = Math.max(2, (width / data.length) - 2);
    const gap = 2;

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = index * (barWidth + gap);
      const y = chartHeight - barHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add pixel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, y, barWidth, 2);
    });
  }, [data, maxValue, color]);

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-xs" style={{ color: 'var(--pixel-text-secondary)' }}>{label}</div>}
      <canvas
        ref={canvasRef}
        width={200}
        height={height}
        className="w-full rounded"
        style={{ height }}
      />
    </div>
  );
}

// Donut chart for task distribution
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

function DonutChart({ data, size = 100 }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 8;
    const innerRadius = radius * 0.6;

    // Clear
    ctx.clearRect(0, 0, size, size);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Inner circle (donut hole)
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();

      startAngle = endAngle;
    });
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="mx-auto"
    />
  );
}

// Real-time metrics display
interface MetricsDisplayProps {
  cpuUsage: number;
  memoryUsage: number;
  apiCalls: number;
}

function MetricsDisplay({ cpuUsage, memoryUsage, apiCalls }: MetricsDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color: cpuUsage > 80 ? '#ef4444' : '#4ade80' }}>
          {cpuUsage}%
        </div>
        <div className="text-xs text-gray-400">CPU</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color: memoryUsage > 80 ? '#ef4444' : '#06b6d4' }}>
          {memoryUsage}%
        </div>
        <div className="text-xs text-gray-400">Memory</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-[#ffd700]">{apiCalls}</div>
        <div className="text-xs text-gray-400">API Calls</div>
      </div>
    </div>
  );
}

// Activity log component
export interface ActivityItem {
  id: string;
  time: string;
  agent: string;
  action: string;
  level: 'info' | 'warn' | 'error' | 'idle';
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {activities.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-1">
          <span className="text-xs text-gray-500 w-10">{item.time}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              item.level === 'info'
                ? 'bg-[#4ade80]'
                : item.level === 'error'
                ? 'bg-[#ef4444]'
                : item.level === 'warn'
                ? 'bg-[#f59e0b]'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-sm truncate">{item.agent}</span>
          <span className="text-sm text-gray-400 truncate">{item.action}</span>
        </div>
      ))}
    </div>
  );
}

export { PixelChart, DonutChart, MetricsDisplay };