import { BareMuxLab } from "./baremux-lab.js";
import { EpoxyLabTransport } from "./epoxy-lab.js";
import { LAB_ORIGIN, normalizeLabUrl, toProxyPath } from "./url-codec.js";

const swStatus = document.querySelector("#sw-status");
const wsStatus = document.querySelector("#ws-status");
const apiOutput = document.querySelector("#api-output");
const wsOutput = document.querySelector("#ws-output");
const urlInput = document.querySelector("#url-input");
const proxyUrl = document.querySelector("#proxy-url");
const proxyTrace = document.querySelector("#proxy-trace");
const proxyFrame = document.querySelector("#proxy-frame");

const epoxy = new EpoxyLabTransport();
const bareMux = new BareMuxLab();
bareMux.setTransport(epoxy);
urlInput.value = `${LAB_ORIGIN}/`;

// Registra el Service Worker igual que una app que necesita interceptación del mismo origen.
if ("serviceWorker" in navigator) {
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    swStatus.textContent = "Registrado y activo";
  } catch (error) {
    swStatus.textContent = `Error: ${error.message}`;
  }
} else {
  swStatus.textContent = "No compatible con este navegador";
}

document.querySelector("#api-test").addEventListener("click", async () => {
  try {
    const response = await fetch("/lab-api/demo");
    const data = await response.json();
    apiOutput.textContent = JSON.stringify({
      status: response.status,
      serviceWorkerHeader: response.headers.get("x-byteshark-lab-sw"),
      data
    }, null, 2);
  } catch (error) {
    apiOutput.textContent = error.message;
  }
});

// Conecta Epoxy-lab al endpoint Wisp-lab.
try {
  await epoxy.connect();
  wsStatus.textContent = "Epoxy-lab conectado a /wisp-lab";
} catch (error) {
  wsStatus.textContent = `Error: ${error.message}`;
}

document.querySelector("#ws-test").addEventListener("click", async () => {
  try {
    const result = await bareMux.fetch(`${LAB_ORIGIN}/data`);
    wsOutput.textContent = JSON.stringify({
      status: result.status,
      transport: result.transport,
      outboundNetworkUsed: result.outboundNetworkUsed,
      trace: result.trace,
      elapsedMs: result.elapsedMs
    }, null, 2);
  } catch (error) {
    wsOutput.textContent = error.message;
  }
});

async function navigateVirtualUrl() {
  try {
    const virtualUrl = normalizeLabUrl(urlInput.value);
    const physicalPath = toProxyPath(virtualUrl);

    proxyUrl.textContent = `${location.origin}${physicalPath}`;
    proxyFrame.src = physicalPath;
    proxyTrace.textContent = "Comprobando transporte…";

    const result = await bareMux.fetch(virtualUrl);
    proxyTrace.textContent = JSON.stringify({
      logicalUrl: virtualUrl,
      physicalUrl: `${location.origin}${physicalPath}`,
      status: result.status,
      contentType: result.contentType,
      trace: result.trace,
      outboundNetworkUsed: result.outboundNetworkUsed,
      elapsedMs: result.elapsedMs
    }, null, 2);
  } catch (error) {
    proxyTrace.textContent = error.message;
  }
}

document.querySelector("#navigate").addEventListener("click", navigateVirtualUrl);
urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    navigateVirtualUrl();
  }
});

await navigateVirtualUrl();
