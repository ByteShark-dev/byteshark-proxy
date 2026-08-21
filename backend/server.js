import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import wisp from 'wisp-server-node';

// Instancias principales
const bareServer = createBareServer('/bare/');
const app = express();
const server = createServer();

// Manejo de peticiones HTTP
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

// Manejo de conexiones WebSocket (Wisp / Bare)
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

// Endpoint de verificación de estado
app.get('/', (req, res) => res.send('ByteShark Proxy Backend: Online'));

// Inicio del servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[CORE] Servidor activo en puerto ${PORT}`));