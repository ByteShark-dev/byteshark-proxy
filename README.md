# ByteShark Proxy Architecture Lab

Laboratorio educativo para estudiar una arquitectura similar a Ultraviolet-App sin convertirla en un proxy hacia Internet.

## Arquitectura

El laboratorio implementa dos recorridos complementarios sobre el mismo origen virtual:

```text
Navegación
Browser
  ↓
URL rewrite (/uv-lab/<url codificada>)
  ↓
Service Worker
  ↓
proxy-lab
  ↓
Virtual origin (demo.byteshark.local)
```

```text
Transporte
Browser
  ↓
BareMux-lab
  ↓
Epoxy-lab
  ↓
WebSocket /wisp-lab
  ↓
proxy-lab
  ↓
Virtual origin
```

## Piezas incluidas

- `public/url-codec.js`: normalización, codificación y reescritura de URL.
- `public/baremux-lab.js`: abstracción de transporte inspirada en la función arquitectónica de BareMux.
- `public/epoxy-lab.js`: transporte WebSocket inspirado en la posición de Epoxy dentro del pipeline.
- `public/sw.js`: Service Worker que intercepta las rutas físicas del laboratorio.
- `src/index.js`: Express, WebSocket y endpoints del laboratorio.
- `src/proxy-lab.js`: proxy virtual aislado y origen de contenido embebido.
- `/wisp-lab`: transporte WebSocket local.
- `/uv-lab/<encoded>`: URL física reescrita.
- `https://demo.byteshark.local/...`: URL lógica mostrada por el simulador.
- `/health`: health check de estilo production.
- `Dockerfile` y `docker-compose.yml`: ejecución contenerizada.
- `railway.json`: estructura Config as Code de Railway.
- `render.yaml`: estructura Blueprint de Render.

## Seguridad del laboratorio

`demo.byteshark.local` es un origen **virtual**, no un hostname que se resuelva por DNS. El servidor no ejecuta `fetch`, sockets TCP ni solicitudes HTTP hacia el hostname introducido por el usuario.

El codificador del navegador y el resolver del servidor validan que todas las URLs pertenezcan exactamente a:

```text
https://demo.byteshark.local
```

Por eso el flujo de URL, Service Worker, BareMux-lab, Epoxy-lab, Wisp-lab y proxy-lab puede inspeccionarse sin ofrecer navegación arbitraria hacia Internet.

## Ejecutar localmente

Requiere Node.js 24 o superior.

```bash
npm install
npm start
```

Abre:

```text
http://127.0.0.1:8080
```

Puedes probar estas URLs lógicas desde la barra del laboratorio:

```text
https://demo.byteshark.local/
https://demo.byteshark.local/about
https://demo.byteshark.local/data
```

La aplicación mostrará simultáneamente la URL física `/uv-lab/...` y el trace del transporte.

También puedes comprobar:

```text
http://127.0.0.1:8080/health
```

## Qué representa frente a Ultraviolet

La intención es que puedas localizar visualmente las mismas responsabilidades arquitectónicas: URL rewriting, Service Worker, abstracción de transporte, transporte WebSocket, servidor y resolución del destino. Las implementaciones `*-lab` no son copias de BareMux, Epoxy o Wisp y no incluyen la capacidad de abrir destinos externos.
