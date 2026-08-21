const LAB_PREFIXES = ["/lab-api/", "/uv-lab/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isLabRequest = url.origin === self.location.origin
    && LAB_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

  if (!isLabRequest) {
    return;
  }

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
});
