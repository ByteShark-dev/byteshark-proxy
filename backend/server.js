import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import wispModule from './lib/wisp-server.js';

// Extraer el handler según exportación ESM
const wisp = wispModule?.routeRequest ? wispModule : (wispModule?.default || wispModule);

const bareServer = createBareServer('/bare/');
const app = express();
const server = createServer();

server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

app.get('/', (req, res) => res.send('ByteShark Proxy Backend: Online'));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[CORE] Servidor activo en puerto ${PORT}`));