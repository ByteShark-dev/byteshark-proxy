importScripts('https://unpkg.com/@mercuryworkshop/bare-mux/dist/bare.cjs');

const BARE_ROUTE = "/__proxy/";
const bareClient = new self.BareMux.BareClient();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith(BARE_ROUTE)) {
        event.respondWith((async () => {
            try {
                const targetUrl = url.pathname.slice(BARE_ROUTE.length) + url.search;
                return await bareClient.fetch(targetUrl, {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: event.request.body
                });
            } catch (error) {
                return new Response(`Error en túnel SW: ${error.message}`, { status: 502 });
            }
        })());
    }
});