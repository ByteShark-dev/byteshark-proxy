const express = require('express');
const { createServer } = require('node:http');
const { createBareServer } = require('@tomphttp/bare-server-node');
const wisp = require('wisp-server-node');

// Initialize Bare server
const bareServer = createBareServer('/bare/');
const app = express();
const server = createServer();

// Normalize Wisp handler for CommonJS compatibility
const wispHandler = wisp.routeRequest ? wisp : (wisp.default || wisp);

// HTTP route handling
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

// WebSocket upgrade handling
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wispHandler.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

// Health check endpoint
app.get('/', (req, res) => res.send('ByteShark Proxy Backend: Online'));

// Server boot
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[CORE] Servidor activo en puerto ${PORT}`));