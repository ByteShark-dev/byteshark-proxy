import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";
import { decodeProxyPath, LAB_ORIGIN, resolveVirtualRequest } from "./proxy-lab.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Este laboratorio reproduce la forma de una app Node desplegable,
// pero todo destino está confinado a un origen virtual interno.
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
    websocket: "/wisp-lab",
    virtualOrigin: LAB_ORIGIN,
    proxyPrefix: "/uv-lab/"
  });
});

// Endpoint local para que el Service Worker tenga algo que interceptar.
app.get("/lab-api/demo", (_req, res) => {
  res.json({
    source: "local-node-server",
    message: "Solicitud interceptada y atendida dentro del laboratorio."
  });
});

// API del proxy-lab. No hace fetch de red: resuelve únicamente el origen virtual embebido.
app.get("/lab-api/proxy", (req, res) => {
  try {
    const result = resolveVirtualRequest(String(req.query.url || LAB_ORIGIN));
    res.status(result.status).type(result.contentType).send(result.body);
  } catch (error) {
    res.status(403).json({ error: error.message, outboundNetworkUsed: false });
  }
});

// URL física equivalente a la ruta reescrita que vería el navegador.
app.get("/uv-lab/:encoded", (req, res) => {
  try {
    const virtualUrl = decodeProxyPath(req.params.encoded);
    const result = resolveVirtualRequest(virtualUrl);
    res.status(result.status).type(result.contentType).send(result.body);
  } catch (error) {
    res.status(400).type("text/plain").send(`URL de laboratorio inválida: ${error.message}`);
  }
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
  ws.send(JSON.stringify({
    type: "ready",
    transport: "wisp-lab",
    outboundNetworkUsed: false
  }));

  ws.on("message", (payload) => {
    let message;

    try {
      message = JSON.parse(payload.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "Mensaje JSON inválido" }));
      return;
    }

    if (message.type === "proxy-request") {
      try {
        const result = resolveVirtualRequest(message.virtualUrl);
        ws.send(JSON.stringify({
          type: "proxy-response",
          id: message.id,
          status: result.status,
          contentType: result.contentType,
          body: result.body,
          transport: "wisp-lab",
          outboundNetworkUsed: false
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: "proxy-error",
          id: message.id,
          error: error.message,
          outboundNetworkUsed: false
        }));
      }
      return;
    }

    // Eco controlado para inspección manual del WebSocket.
    ws.send(JSON.stringify({
      type: "echo",
      id: message.id,
      payload: message,
      outboundNetworkUsed: false
    }));
  });
});

server.listen(port, host, () => {
  console.log(`[ByteShark Lab] http://${host}:${port}`);
  console.log(`[ByteShark Lab] Virtual origin: ${LAB_ORIGIN}`);
  console.log("[ByteShark Lab] Outbound proxy: disabled");
});
