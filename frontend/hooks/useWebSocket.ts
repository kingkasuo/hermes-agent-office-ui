'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  ServerMessage,
  SystemState,
  PixelAgent,
  HermesLog,
  TaskUpdateData,
  AgentsUpdateData,
  SessionMessagesData,
} from '../../shared/types/hermes';

interface UseWebSocketReturn {
  isConnected: boolean;
  systemState: SystemState | null;
  agents: PixelAgent[];
  logs: HermesLog[];
  lastMessage: ServerMessage | null;
  error: string | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [agents, setAgents] = useState<PixelAgent[]>([]);
  const [logs, setLogs] = useState<HermesLog[]>([]);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Reconnecting...');
          connect();
        }, 3000);
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          setLastMessage(message);

          switch (message.type) {
            case 'system_update':
              setSystemState(message.data as SystemState);
              break;

            case 'agents_update':
              const { agents: newAgents } = message.data as AgentsUpdateData;
              setAgents(newAgents);
              break;

            case 'log':
              const log = message.data as HermesLog;
              setLogs((prev) => [log, ...prev].slice(0, 100));
              break;

            case 'task_update':
              // Task updates are handled by the parent component
              break;

            case 'session_messages':
              // Session messages are handled by the parent component
              break;

            case 'error':
              console.error('[WebSocket] Server error:', message.data);
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    systemState,
    agents,
    logs,
    lastMessage,
    error,
  };
}
