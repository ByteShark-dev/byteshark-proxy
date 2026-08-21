import { normalizeLabUrl } from "./url-codec.js";

export class BareMuxLab {
  constructor() {
    this.transport = null;
  }

  setTransport(transport) {
    this.transport = transport;
  }

  async fetch(url) {
    if (!this.transport) {
      throw new Error("BareMux-lab no tiene transporte configurado");
    }

    const virtualUrl = normalizeLabUrl(url);
    const startedAt = performance.now();
    const response = await this.transport.request(virtualUrl);

    return {
      ...response,
      trace: [
        "url-rewrite",
        "baremux-lab",
        "epoxy-lab",
        "wisp-lab",
        "proxy-lab",
        "virtual-origin"
      ],
      elapsedMs: Math.round(performance.now() - startedAt)
    };
  }
}
