import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import wisp from 'wisp-server-node';

// Crear instancia de servidor Bare
const bareServer = createBareServer('/bare/');
const app = express();
const server = createServer();

// Manejar peticiones HTTP normales y de Bare
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

// Manejar conexiones WebSocket para Wisp y Bare
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

// Endpoint de salud
app.get('/', (req, res) => res.send('ByteShark Proxy Backend: Online'));

// Escuchar en el puerto asignado
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[CORE] Servidor activo en puerto ${PORT}`));