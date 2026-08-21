const LAB_ORIGIN = "https://demo.byteshark.local";

function normalizeVirtualUrl(input) {
  const url = new URL(input, LAB_ORIGIN);

  if (url.origin !== LAB_ORIGIN) {
    throw new Error(`Destino bloqueado: este laboratorio solo sirve ${LAB_ORIGIN}`);
  }

  return url;
}

function proxyPath(input) {
  const url = normalizeVirtualUrl(input);
  return `/uv-lab/${Buffer.from(url.href, "utf8").toString("base64url")}`;
}

function pageTemplate({ title, heading, body, currentUrl }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; line-height: 1.55; }
    nav { display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap; }
    a { color: #2457d6; }
    code, pre { background: #f1f3f5; border-radius: 8px; padding: 3px 6px; }
    pre { padding: 14px; overflow: auto; }
    .badge { display: inline-block; padding: 5px 9px; border: 1px solid #bbb; border-radius: 999px; }
  </style>
</head>
<body>
  <span class="badge">Virtual origin · sin Internet</span>
  <h1>${heading}</h1>
  ${body}
  <nav>
    <a href="${proxyPath(`${LAB_ORIGIN}/`)}">Inicio</a>
    <a href="${proxyPath(`${LAB_ORIGIN}/about`)}">Acerca de</a>
    <a href="${proxyPath(`${LAB_ORIGIN}/data`)}">Datos</a>
  </nav>
  <hr />
  <small>URL lógica: <code>${currentUrl}</code></small>
</body>
</html>`;
}

export function resolveVirtualRequest(input) {
  const url = normalizeVirtualUrl(input);

  if (url.pathname === "/") {
    return {
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: pageTemplate({
        title: "Demo Local",
        heading: "Sitio virtual de prueba",
        currentUrl: url.href,
        body: "<p>Esta página parece venir de otro origen, pero se genera completamente dentro del proceso Node local.</p><p>Los enlaces ya están reescritos al prefijo <code>/uv-lab/</code>.</p>"
      })
    };
  }

  if (url.pathname === "/about") {
    return {
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: pageTemplate({
        title: "Acerca de",
        heading: "Qué está simulando",
        currentUrl: url.href,
        body: "<p>URL rewriting, transporte, WebSocket y resolución de contenido, sin realizar ninguna conexión a hosts externos.</p>"
      })
    };
  }

  if (url.pathname === "/data") {
    return {
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: pageTemplate({
        title: "Datos",
        heading: "Respuesta dinámica local",
        currentUrl: url.href,
        body: `<pre>${JSON.stringify({ source: "virtual-origin", generatedAt: new Date().toISOString(), outboundNetworkUsed: false }, null, 2)}</pre>`
      })
    };
  }

  return {
    status: 404,
    contentType: "text/html; charset=utf-8",
    body: pageTemplate({
      title: "404",
      heading: "Ruta virtual no encontrada",
      currentUrl: url.href,
      body: `<p>No existe <code>${url.pathname}</code> dentro del origen virtual.</p>`
    })
  };
}

export function decodeProxyPath(encoded) {
  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  return normalizeVirtualUrl(decoded).href;
}

export { LAB_ORIGIN };
