import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { networkInterfaces } from 'os';

// Use relative imports
import { initWebSocketServer } from './src/lib/websocket-server';
import { agentMonitor } from './src/server/agent-monitor';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3001', 10);

// Get local IP address for display
const nets = networkInterfaces();
let localIp = 'localhost';
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      localIp = net.address;
      break;
    }
  }
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Handle CORS preflight
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  initWebSocketServer(server);

  // Start agent monitor
  agentMonitor.start();

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://localhost:${port}`);
      console.log(`> Ready on http://${localIp}:${port}`);
      console.log(`> WebSocket server ready on ws://${localIp}:${port}/ws`);
    });
});
