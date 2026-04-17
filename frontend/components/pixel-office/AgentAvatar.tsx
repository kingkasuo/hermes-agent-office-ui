'use client';

import { useEffect, useRef } from 'react';

type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

interface AgentAvatarProps {
  name: string;
  status: AgentStatus;
  color: string;
  size?: number;
  showName?: boolean;
}

export function AgentAvatar({
  name,
  status,
  color,
  size = 64,
  showName = true,
}: AgentAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable smoothing for pixel effect
    ctx.imageSmoothingEnabled = false;
    
    const pixelSize = size / 16;
    const centerX = size / 2;
    const centerY = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw status indicator
    const statusColor = getStatusColor(status);
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(size - pixelSize * 2, pixelSize * 2, pixelSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw body (16x16 pixel grid scaled)
    ctx.fillStyle = color;
    
    // Body - main rectangle
    for (let y = 4; y < 12; y++) {
      for (let x = 6; x < 10; x++) {
        ctx.fillRect(
          x * pixelSize,
          y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }

    // Head
    for (let y = 2; y < 6; y++) {
      for (let x = 5; x < 11; x++) {
        ctx.fillRect(
          x * pixelSize,
          y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }

    // Eyes based on status
    ctx.fillStyle = '#000';
    const eyeY = 4 * pixelSize;
    
    if (status === 'BUSY') {
      // Focused eyes (lines)
      ctx.fillRect(centerX - pixelSize * 2, eyeY, pixelSize * 1.5, pixelSize);
      ctx.fillRect(centerX + pixelSize * 0.5, eyeY, pixelSize * 1.5, pixelSize);
    } else if (status === 'ERROR') {
      // X eyes
      ctx.fillRect(centerX - pixelSize * 2.5, eyeY, pixelSize, pixelSize * 1.5);
      ctx.fillRect(centerX + pixelSize * 1.5, eyeY + pixelSize * 0.5, pixelSize, pixelSize);
    } else if (status === 'OFFLINE') {
      // Dotted eyes
      ctx.beginPath();
      ctx.arc(centerX - pixelSize * 1.5, eyeY + pixelSize, pixelSize * 0.3, 0, Math.PI * 2);
      ctx.arc(centerX + pixelSize * 1.5, eyeY + pixelSize, pixelSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal eyes
      ctx.fillRect(centerX - pixelSize * 2, eyeY, pixelSize, pixelSize * 1.5);
      ctx.fillRect(centerX + pixelSize, eyeY, pixelSize, pixelSize * 1.5);
    }

    // Animation for BUSY status
    if (status === 'BUSY') {
      const offset = Math.sin(Date.now() / 200) * pixelSize * 0.3;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(centerX + pixelSize * 3, centerY + offset, pixelSize, pixelSize);
    }

  }, [name, status, color, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
      {showName && (
        <span className="text-xs text-gray-400">{name}</span>
      )}
    </div>
  );
}

function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'ONLINE':
      return '#4ade80';
    case 'BUSY':
      return '#f59e0b';
    case 'IDLE':
      return '#06b6d4';
    case 'ERROR':
      return '#ef4444';
    case 'OFFLINE':
    default:
      return '#6b7280';
  }
}