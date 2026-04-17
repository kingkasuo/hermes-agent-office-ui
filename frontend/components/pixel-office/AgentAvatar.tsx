'use client';

import { useEffect, useRef } from 'react';
import type { AgentStatus } from '@shared/types/agent';

interface AgentAvatarProps {
  name: string;
  status: AgentStatus;
  color: string;
  size?: number;
  isAnimating?: boolean;
}

export function AgentAvatar({
  name,
  status,
  color,
  size = 64,
  isAnimating = true
}: AgentAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set pixelated rendering
    ctx.imageSmoothingEnabled = false;

    // Draw pixel avatar logic
    const drawAvatar = () => {
      ctx.clearRect(0, 0, size, size);

      // Base scale for 16x16 grid
      const pixelSize = size / 16;

      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, size, size);

      // Body (center 8x8)
      ctx.fillStyle = color;
      for (let y = 4; y < 12; y++) {
        for (let x = 4; x < 12; x++) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }

      // Head (top center 6x4)
      ctx.fillStyle = adjustColor(color, 20);
      for (let y = 2; y < 6; y++) {
        for (let x = 5; x < 11; x++) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }

      // Eyes based on status
      ctx.fillStyle = '#000';
      if (status === 'BUSY') {
        // Focused squint
        ctx.fillRect(6 * pixelSize, 4 * pixelSize, 2 * pixelSize, pixelSize);
        ctx.fillRect(10 * pixelSize, 4 * pixelSize, 2 * pixelSize, pixelSize);
      } else if (status === 'OFFLINE') {
        // Closed eyes
        ctx.fillRect(6 * pixelSize, 5 * pixelSize, 2 * pixelSize, pixelSize / 2);
        ctx.fillRect(10 * pixelSize, 5 * pixelSize, 2 * pixelSize, pixelSize / 2);
      } else {
        // Normal eyes
        ctx.fillRect(6 * pixelSize, 4 * pixelSize, pixelSize, 2 * pixelSize);
        ctx.fillRect(10 * pixelSize, 4 * pixelSize, pixelSize, 2 * pixelSize);
      }

      // Legs
      ctx.fillStyle = adjustColor(color, -20);
      ctx.fillRect(5 * pixelSize, 12 * pixelSize, 2 * pixelSize, 3 * pixelSize);
      ctx.fillRect(9 * pixelSize, 12 * pixelSize, 2 * pixelSize, 3 * pixelSize);

      // Status indicator border
      const statusColor = getStatusColor(status);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);
    };

    drawAvatar();

    // Animation loop
    let animationId: number;
    if (isAnimating && (status === 'BUSY' || status === 'ONLINE')) {
      let frame = 0;
      const animate = () => {
        frame++;
        if (frame % 8 === 0) {
          drawAvatar();
          // Working animation effect
          if (status === 'BUSY') {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + Math.sin(frame / 16) * 0.15})`;
            ctx.fillRect(0, 0, size, size);
          }
        }
        animationId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [name, status, color, size, isAnimating]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pixelated rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function getStatusColor(status: AgentStatus): string {
  const colors: Record<AgentStatus, string> = {
    ONLINE: '#4ade80',
    OFFLINE: '#6b7280',
    BUSY: '#f59e0b',
    IDLE: '#3b82f6',
    ERROR: '#ef4444',
  };
  return colors[status];
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount, 0, 255);
  const g = clamp(((num >> 8) & 0x00FF) + amount, 0, 255);
  const b = clamp((num & 0x0000FF) + amount, 0, 255);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default AgentAvatar;
