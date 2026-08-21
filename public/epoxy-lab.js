import { normalizeLabUrl } from "./url-codec.js";

export class EpoxyLabTransport {
  constructor(endpoint = "/wisp-lab") {
    this.endpoint = endpoint;
    this.socket = null;
    this.pending = new Map();
    this.counter = 0;
  }

  async connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    this.socket = new WebSocket(`${protocol}//${location.host}${this.endpoint}`);

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", () => reject(new Error("No se pudo abrir Wisp-lab")), { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);

      if (!pending) {
        return;
      }

      this.pending.delete(message.id);
      pending.resolve(message);
    });
  }

  async request(url) {
    const virtualUrl = normalizeLabUrl(url);
    await this.connect();

    const id = `req-${++this.counter}`;
    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      setTimeout(() => {
        if (this.pending.delete(id)) {
          reject(new Error("Timeout del transporte local"));
        }
      }, 5000);
    });

    this.socket.send(JSON.stringify({
      type: "proxy-request",
      id,
      virtualUrl,
      transport: "epoxy-lab"
    }));

    return response;
  }
}
