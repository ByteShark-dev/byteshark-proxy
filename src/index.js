import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Este laboratorio reproduce la forma de una app Node desplegable,
// pero deliberadamente no implementa proxy ni salida hacia Internet.
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";

app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mode: "local-lab",
    outboundProxy: false,
    websocket: "/wisp-lab"
  });
});

// Endpoint local para que el Service Worker tenga algo que interceptar.
app.get("/lab-api/demo", (_req, res) => {
  res.json({
    source: "local-node-server",
    message: "Solicitud interceptada y atendida dentro del laboratorio."
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname !== "/wisp-lab") {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "ready", transport: "local-websocket-simulator" }));

  // Eco controlado: demuestra transporte bidireccional sin conectar a terceros.
  ws.on("message", (payload) => {
    ws.send(JSON.stringify({
      type: "echo",
      payload: payload.toString(),
      outboundNetworkUsed: false
    }));
  });
});

server.listen(port, host, () => {
  console.log(`[ByteShark Lab] http://${host}:${port}`);
  console.log("[ByteShark Lab] Outbound proxy: disabled");
});
