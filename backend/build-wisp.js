import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

// Ruta al módulo wisp-server-node y carpeta destino local
const wispDir = path.resolve('node_modules/wisp-server-node');
const outDir = path.resolve('lib');

if (!fs.existsSync(wispDir)) {
    console.error('[BUILD-WISP] Módulo wisp-server-node no encontrado.');
    process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// Buscar recursivamente todos los archivos de código
function getCodeFiles(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
                files = files.concat(getCodeFiles(fullPath));
            }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFiles = getCodeFiles(wispDir);

// Seleccionar el archivo principal por prioridad
const entry = allFiles.find(f => /index\.(ts|js)$/i.test(f))
           || allFiles.find(f => /server\.(ts|js)$/i.test(f))
           || allFiles.find(f => /wisp\.(ts|js)$/i.test(f))
           || allFiles.find(f => /main\.(ts|js)$/i.test(f))
           || allFiles[0];

if (!entry) {
    console.error('[BUILD-WISP] No se encontraron archivos de código fuente.');
    process.exit(1);
}

console.log(`[BUILD-WISP] Entrada detectada: ${path.relative(wispDir, entry)}`);

// Empaquetar en un único archivo ESM local en lib/wisp-server.js
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

console.log('[BUILD-WISP] Bundle local generado exitosamente en lib/wisp-server.js');