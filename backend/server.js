import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import wisp from 'wisp-server-node';

// Instancia del servidor Bare
const bareServer = createBareServer('/bare/');
const app = express();
const server = createServer();

// Manejo de peticiones HTTP convencionales y protocolo Bare
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

// Manejo de actualización de protocolo WebSocket (Wisp y Bare)
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

// Ruta de comprobación de estado
app.get('/', (req, res) => res.send('ByteShark Proxy Backend: Online'));

// Inicialización del servicio
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[CORE] Servidor escuchando en puerto ${PORT}`));