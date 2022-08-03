import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import url from 'url';
import { WebSocketServer } from 'ws';

// Check for required environment variables
if (!process.env.KCP_SERVER_URL || !process.env.HAC_CORE_ORIGIN) {
  throw new Error('Set environment variables KCP_SERVER_URL and HAC_CORE_ORIGIN');
  process.exit(1);
}

const kcpServerURL = new URL(process.env.KCP_SERVER_URL);
const kcpHost = kcpServerURL.origin;
const kcpPath = kcpServerURL.pathname;
const redirectPathForWorkspaces = '/services/workspaces/root:rh-sso-15850190/all';

const app = express();

// Add CORS headers to request
app.use(cors({
  origin: process.env.HAC_CORE_ORIGIN,
  credentials: true
}));

// Proxy to KCP server
const apiProxy = proxy(kcpHost, {
  proxyReqPathResolver: req => {
    const requestedPath = url.parse(req.originalUrl).path;
    let updatedPath = kcpPath + url.parse(req.originalUrl).path;
    /**
     * The endpoint /clusters/root:rh-sso-1585019/apis/tenancy.kcp.dev/v1beta1/workspaces
     * redirects to /services/workspaces/system:admin/all/apis/tenancy.kcp.dev/v1beta1/workspaces
     * Proxying to the redirect URL here so that the CORS headers are present on the request
     */
    if (requestedPath.includes('/apis/tenancy.kcp.dev/v1beta1/workspaces')) {
      updatedPath = redirectPathForWorkspaces + requestedPath;
    }
    return updatedPath;
  },
});

app.use(['/apis', '/api/v1'], apiProxy);

// Start server
const server = app.listen(3000, () => {
  console.log('Proxy server listening on port 3000');
});

// Enable WebSockets support
const ws = new WebSocketServer({ noServer: true });
ws.on('connection', ws => {
  console.log('Client connected.');
});

server.on('upgrade', (request, socket, head) => {
  ws.handleUpgrade(request, socket, head, (websocket) => {
    console.log('Upgrade to handle websockets');
    ws.emit('connection', websocket, request);
  });
});