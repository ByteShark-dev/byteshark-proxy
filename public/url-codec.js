// Codificador deliberadamente limitado al origen virtual del laboratorio.
// No acepta URLs arbitrarias ni destinos de Internet.
export const LAB_ORIGIN = "https://demo.byteshark.local";

export function normalizeLabUrl(input) {
  const url = new URL(input, LAB_ORIGIN);

  if (url.origin !== LAB_ORIGIN) {
    throw new Error(`Solo se permite el origen virtual ${LAB_ORIGIN}`);
  }

  return url.href;
}

export function encodeLabUrl(input) {
  const normalized = normalizeLabUrl(input);
  const bytes = new TextEncoder().encode(normalized);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodeLabUrl(encoded) {
  const padded = encoded.replaceAll("-", "+").replaceAll("_", "/")
    + "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return normalizeLabUrl(new TextDecoder().decode(bytes));
}

export function toProxyPath(input) {
  return `/uv-lab/${encodeLabUrl(input)}`;
}
