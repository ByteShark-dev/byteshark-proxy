import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const wispDir = path.resolve('node_modules/wisp-server-node');
const outDir = path.resolve('lib');

if (!fs.existsSync(wispDir)) {
    console.error('[BUILD-WISP] Módulo wisp-server-node no encontrado.');
    process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// Buscar entrada principal en el paquete
const candidates = [
    'src/index.ts', 'src/server.ts', 'src/index.js',
    'index.ts', 'server.ts', 'index.js'
];

let entry = null;
for (const cand of candidates) {
    const p = path.join(wispDir, cand);
    if (fs.existsSync(p)) {
        entry = p;
        break;
    }
}

if (!entry) {
    console.error('[BUILD-WISP] No se encontró el punto de entrada.');
    process.exit(1);
}

// Generar bundle ESM en la carpeta local lib/
buildSync({
    entryPoints: [entry],
    outFile: path.join(outDir, 'wisp-server.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    external: ['ws', 'node:*'],
    logLevel: 'silent'
});

console.log('[BUILD-WISP] Bundle local generado correctamente en lib/wisp-server.js');