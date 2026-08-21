const swStatus = document.querySelector("#sw-status");
const wsStatus = document.querySelector("#ws-status");
const apiOutput = document.querySelector("#api-output");
const wsOutput = document.querySelector("#ws-output");

// Registra el Service Worker igual que una app moderna que necesita interceptación local.
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
    apiOutput.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    apiOutput.textContent = error.message;
  }
});

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${protocol}//${location.host}/wisp-lab`);

socket.addEventListener("open", () => {
  wsStatus.textContent = "Conectado a /wisp-lab";
});

socket.addEventListener("message", (event) => {
  try {
    wsOutput.textContent = JSON.stringify(JSON.parse(event.data), null, 2);
  } catch {
    wsOutput.textContent = event.data;
  }
});

socket.addEventListener("close", () => {
  wsStatus.textContent = "Desconectado";
});

document.querySelector("#ws-test").addEventListener("click", () => {
  if (socket.readyState !== WebSocket.OPEN) {
    wsOutput.textContent = "WebSocket aún no está abierto.";
    return;
  }

  socket.send(JSON.stringify({
    action: "transport-test",
    destination: "local-only"
  }));
});
