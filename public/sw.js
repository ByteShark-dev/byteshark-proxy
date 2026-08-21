const LAB_PREFIX = "/lab-api/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo observa y marca tráfico del propio laboratorio.
  // Nunca reescribe destinos externos ni actúa como proxy.
  if (url.origin === self.location.origin && url.pathname.startsWith(LAB_PREFIX)) {
    event.respondWith((async () => {
      const response = await fetch(event.request);
      const headers = new Headers(response.headers);
      headers.set("x-byteshark-lab-sw", "intercepted");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    })());
  }
});
