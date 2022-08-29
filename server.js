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

const contextWorkspace = process.env.KCP_SERVER_URL.split("/").pop();
const kcpServerURL = new URL(process.env.KCP_SERVER_URL);
const kcpHost = kcpServerURL.origin;
const kcpPath = kcpServerURL.pathname;
const redirectPathForWorkspaces = `/services/workspaces/${contextWorkspace}`;

const app = express();

// Add CORS headers to request
app.use(cors({
  origin: process.env.HAC_CORE_ORIGIN,
  credentials: true
}));

const proxyOptions = {
  proxyReqPathResolver: req => {
    const requestedPath = url.parse(req.originalUrl).path;
    let updatedPath = kcpPath + url.parse(req.originalUrl).path;

    /**
     * The redirects for the "workspaces" APIs are different based on the KCP host server & the request method:
     * 1. kcp-stable:
     *    GET/DELETE requests on /clusters/<workspace>/apis/.. redirect to /services/workspaces/<workspace>/all/apis/..
     *    POST requests on /clusters/<workspace>/apis/.. redirect to /services/workspaces/<workspace>/personal/apis/..
     * 2. kcp-unstable:
     *    requests on /clusters/<workspace>/apis/.. redirect to /services/workspaces/<workspace>/apis/..
     */
    if (requestedPath.includes('/apis/tenancy.kcp.dev/v1beta1/workspaces')) {
      if (kcpHost.includes('kcp-unstable')) {
        // Create - Doesn't work with the workspace name in the path
        updatedPath = req.method === 'POST' ? (redirectPathForWorkspaces + '/apis/tenancy.kcp.dev/v1beta1/workspaces') : (redirectPathForWorkspaces + requestedPath);
      } else {
        // Create - Doesn't work with the workspace name in the path
        updatedPath = req.method === 'POST' ? (redirectPathForWorkspaces + '/personal/apis/tenancy.kcp.dev/v1beta1/workspaces') : (redirectPathForWorkspaces + '/all' + requestedPath);
      }
    }
    return updatedPath;
  },
};

// Proxy to KCP server
const apiProxy = proxy(kcpHost, proxyOptions);

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