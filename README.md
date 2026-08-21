# ByteShark Proxy Architecture Lab

Laboratorio educativo para estudiar la arquitectura de una aplicación web moderna con una forma similar a proyectos como Ultraviolet-App, sin implementar navegación proxy ni salida hacia sitios externos.

## Arquitectura

```text
Browser
  ↓
Frontend
  ↓
Service Worker
  ↓
Same-origin local API
  ↓
WebSocket transport simulator (/wisp-lab)
  ↓
Node.js / Express
```

## Piezas incluidas

- `public/`: interfaz estática.
- `public/sw.js`: Service Worker limitado al origen local.
- `src/index.js`: servidor Express y WebSocket.
- `/health`: health check de estilo production.
- `Dockerfile`: imagen de producción.
- `docker-compose.yml`: ejecución local contenerizada.
- `railway.json`: Config as Code compatible con Railway.
- `render.yaml`: Blueprint compatible con Render.

## Seguridad del laboratorio

El servidor usa `127.0.0.1` por defecto y no implementa conexiones proxy salientes. El WebSocket `/wisp-lab` es solamente un eco local para visualizar transporte bidireccional.

## Ejecutar localmente

Requiere Node.js 24 o superior.

```bash
npm install
npm start
```

Después abre:

```text
http://127.0.0.1:8080
```

Comprueba también:

```text
http://127.0.0.1:8080/health
```

## Qué representa frente a una app desplegada

La estructura reproduce gran parte del ciclo real: repositorio → instalación de dependencias → proceso Node → contenido estático → Service Worker → WebSocket → health checks → configuración de plataforma. Lo que falta deliberadamente es el componente que convertiría el transporte en un proxy hacia destinos externos.
