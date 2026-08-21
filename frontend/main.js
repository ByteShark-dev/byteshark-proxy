import { BareMuxConnection } from '@mercuryworkshop/bare-mux';

const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const btnTest = document.getElementById('btn-test');

const log = (msg) => logEl.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;

// Cambiar por la URL de producción en Render cuando se despliegue
const BACKEND_WISP_URL = 'ws://localhost:8080/wisp/'; 

async function init() {
    try {
        log("Iniciando BareMux...");
        const connection = new BareMuxConnection('https://unpkg.com/@mercuryworkshop/bare-mux/dist/worker.js');
        
        await connection.setTransport('https://unpkg.com/@mercuryworkshop/epoxy-transport/dist/index.mjs', [{ wisp: BACKEND_WISP_URL }]);
        log(`Túnel Epoxy enlazado a: ${BACKEND_WISP_URL}`);

        log("Registrando Service Worker...");
        await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        
        log("Service Worker activo.");
        statusEl.textContent = "Estado: Listo";
        btnTest.disabled = false;
    } catch (error) {
        log(`ERROR: ${error.message}`);
        statusEl.textContent = "Estado: Error de inicialización";
    }
}

btnTest.addEventListener('click', async () => {
    const url = document.getElementById('target-url').value;
    log(`Enviando solicitud vía SW: ${url}`);
    
    try {
        const res = await fetch(`/__proxy/${url}`);
        const data = await res.text();
        log(`Respuesta [${res.status}]: ${data.substring(0, 120)}...`);
    } catch (err) {
        log(`Error Fetch: ${err.message}`);
    }
});

init();