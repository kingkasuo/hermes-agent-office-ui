'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PixelAgent } from '../../../shared/types/hermes';

interface PixelCanvasProps {
  agents: PixelAgent[];
  onAgentClick?: (agent: PixelAgent) => void;
}

// Canvas configuration
const CELL_SIZE = 100;
const SPACING = 20;
const AVATAR_SIZE = 64;

export function PixelCanvas({ agents, onAgentClick }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const agentsRef = useRef<PixelAgent[]>(agents);

  // Keep agents ref up to date
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Draw a pixel agent
  const drawAgent = useCallback((
    ctx: CanvasRenderingContext2D,
    agent: PixelAgent,
    x: number,
    y: number,
    frame: number
  ) => {
    const pixelSize = AVATAR_SIZE / 16;

    // Clear area
    ctx.clearRect(x, y, CELL_SIZE, CELL_SIZE);

    // Draw workstation background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Draw pixel border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

    // Calculate avatar position (centered)
    const avatarX = x + (CELL_SIZE - AVATAR_SIZE) / 2;
    const avatarY = y + 10;

    // Draw avatar background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);

    // Draw pixel avatar
    drawPixelAvatar(ctx, agent, avatarX, avatarY, pixelSize, frame);

    // Draw status indicator
    drawStatusIndicator(ctx, agent, x + 10, y + 10);

    // Draw name
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      agent.displayName.slice(0, 12),
      x + CELL_SIZE / 2,
      y + AVATAR_SIZE + 25
    );

    // Draw activity description
    if (agent.currentActivity) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(
        agent.currentActivity.description.slice(0, 20),
        x + CELL_SIZE / 2,
        y + AVATAR_SIZE + 38
      );
    }

    // Draw effects
    if (agent.appearance.effects.includes('glow')) {
      drawGlowEffect(ctx, x, y, frame);
    }

    if (agent.appearance.effects.includes('typing')) {
      drawTypingEffect(ctx, x, y, frame);
    }

    if (agent.appearance.effects.includes('alert')) {
      drawAlertEffect(ctx, x, y, frame);
    }
  }, []);

  // Draw pixel avatar
  const drawPixelAvatar = (
    ctx: CanvasRenderingContext2D,
    agent: PixelAgent,
    x: number,
    y: number,
    pixelSize: number,
    frame: number
  ) => {
    const color = agent.appearance.color;
    const status = agent.status;

    // Body (simple 16x16 grid scaled)
    ctx.fillStyle = color;

    // Different poses based on status
    if (status === 'working') {
      // Typing pose - arms forward
      for (let row = 6; row < 14; row++) {
        for (let col = 4; col < 12; col++) {
          // Skip corners for rounded look
          if ((row === 6 || row === 13) && (col === 4 || col === 11)) continue;
          ctx.fillRect(
            x + col * pixelSize,
            y + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }

      // Animated typing arms
      const armOffset = Math.sin(frame / 4) * 2;
      ctx.fillRect(x + 2 * pixelSize, y + (8 + armOffset) * pixelSize, 2 * pixelSize, 2 * pixelSize);
      ctx.fillRect(x + 12 * pixelSize, y + (8 - armOffset) * pixelSize, 2 * pixelSize, 2 * pixelSize);
    } else if (status === 'busy') {
      // Thinking pose - hand on chin
      for (let row = 6; row < 14; row++) {
        for (let col = 4; col < 12; col++) {
          if ((row === 6 || row === 13) && (col === 4 || col === 11)) continue;
          ctx.fillRect(
            x + col * pixelSize,
            y + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }

      // Hand on chin
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 10 * pixelSize, y + 8 * pixelSize, 2 * pixelSize, 3 * pixelSize);
    } else {
      // Idle pose
      for (let row = 6; row < 14; row++) {
        for (let col = 4; col < 12; col++) {
          if ((row === 6 || row === 13) && (col === 4 || col === 11)) continue;
          ctx.fillRect(
            x + col * pixelSize,
            y + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    // Eyes
    ctx.fillStyle = '#000';
    if (status === 'working') {
      // Focused eyes
      ctx.fillRect(x + 6 * pixelSize, y + 7 * pixelSize, pixelSize, 2 * pixelSize);
      ctx.fillRect(x + 10 * pixelSize, y + 7 * pixelSize, pixelSize, 2 * pixelSize);
    } else if (status === 'busy') {
      // Thinking eyes (looking up)
      ctx.fillRect(x + 6 * pixelSize, y + 6 * pixelSize, pixelSize, 2 * pixelSize);
      ctx.fillRect(x + 10 * pixelSize, y + 6 * pixelSize, pixelSize, 2 * pixelSize);
    } else {
      // Normal eyes
      ctx.fillRect(x + 6 * pixelSize, y + 7 * pixelSize, 2 * pixelSize, 2 * pixelSize);
      ctx.fillRect(x + 10 * pixelSize, y + 7 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    }

    // Head (slightly smaller than body)
    ctx.fillStyle = color;
    for (let row = 4; row < 10; row++) {
      for (let col = 5; col < 11; col++) {
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  };

  // Draw status indicator
  const drawStatusIndicator = (
    ctx: CanvasRenderingContext2D,
    agent: PixelAgent,
    x: number,
    y: number
  ) => {
    const colors: Record<string, string> = {
      idle: '#4ade80',
      working: '#fbbf24',
      busy: '#f59e0b',
      offline: '#6b7280',
      error: '#ef4444',
    };

    ctx.fillStyle = colors[agent.status] || '#6b7280';
    ctx.fillRect(x, y, 8, 8);

    // Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 8, 8);
  };

  // Draw glow effect
  const drawGlowEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ) => {
    const alpha = 0.3 + Math.sin(frame / 8) * 0.2;
    ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
    ctx.fillRect(x - 2, y - 2, CELL_SIZE + 4, CELL_SIZE + 4);
  };

  // Draw typing effect
  const drawTypingEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ) => {
    const dotCount = 3;
    const baseX = x + CELL_SIZE - 25;
    const baseY = y + CELL_SIZE - 15;

    for (let i = 0; i < dotCount; i++) {
      const offset = (frame + i * 10) % 20;
      const alpha = offset / 20;
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.fillRect(baseX + i * 8, baseY - offset / 4, 4, 4);
    }
  };

  // Draw alert effect
  const drawAlertEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ) => {
    const blink = frame % 20 < 10;
    if (blink) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x - 4, y - 4, CELL_SIZE + 8, CELL_SIZE + 8);
    }
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    let frame = 0;

    const animate = () => {
      frame++;

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      drawGrid(ctx, canvas.width, canvas.height);

      // Draw agents
      const cols = 4;
      agentsRef.current.forEach((agent, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = 20 + col * (CELL_SIZE + SPACING);
        const y = 20 + row * (CELL_SIZE + SPACING + 20);

        drawAgent(ctx, agent, x, y, frame);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawAgent]);

  // Draw grid background
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    const gridSize = 20;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAgentClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked agent
    const cols = 4;
    agents.forEach((agent, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cellX = 20 + col * (CELL_SIZE + SPACING);
      const cellY = 20 + row * (CELL_SIZE + SPACING + 20);

      if (
        x >= cellX &&
        x <= cellX + CELL_SIZE &&
        y >= cellY &&
        y <= cellY + CELL_SIZE
      ) {
        onAgentClick(agent);
      }
    });
  };

  // Calculate canvas size
  const cols = 4;
  const rows = Math.ceil(agents.length / cols);
  const canvasWidth = 40 + cols * (CELL_SIZE + SPACING);
  const canvasHeight = 40 + rows * (CELL_SIZE + SPACING + 20);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={Math.max(canvasHeight, 400)}
      onClick={handleClick}
      className="cursor-pointer"
      style={{
        imageRendering: 'pixelated',
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}
