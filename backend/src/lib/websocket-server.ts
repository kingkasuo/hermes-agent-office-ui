// WebSocket 服务器实现
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { memoryStore } from './memory-store';
import type { WebSocketMessage } from '../../../shared/types/websocket';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');
    memoryStore.addWsClient(ws);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to Hermes Agent Office' },
      timestamp: Date.now()
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage<unknown>;
        handleMessage(ws, message);
      } catch (error) {
        console.error('[WebSocket] Invalid message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      memoryStore.removeWsClient(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      memoryStore.removeWsClient(ws);
    });
  });

  console.log('[WebSocket] Server initialized on /ws');
  return wss;
}

function handleMessage(ws: WebSocket, message: WebSocketMessage<unknown>) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', data: null, timestamp: Date.now() }));
      break;
    default:
      console.log('[WebSocket] Received:', message.type);
  }
}

export function broadcast(message: WebSocketMessage<unknown>) {
  if (!wss) return;
  memoryStore.broadcast(message);
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
