import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const wispDir = path.resolve('node_modules/wisp-server-node');

if (!fs.existsSync(wispDir)) {
    console.log('[BUILD-WISP] Módulo wisp-server-node no encontrado.');
    process.exit(0);
}

// 1. Crear directorio dist
const distDir = path.join(wispDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// 2. Localizar punto de entrada principal
let entryPoint = path.join(wispDir, 'src/index.ts');
if (!fs.existsSync(entryPoint)) {
    const srcFiles = fs.readdirSync(path.join(wispDir, 'src'));
    const tsFile = srcFiles.find(f => f.endsWith('.ts'));
    if (tsFile) entryPoint = path.join(wispDir, 'src', tsFile);
}

// 3. Empaquetar todo el código en un único bundle ESM
buildSync({
    entryPoints: [entryPoint],
    outFile: path.join(distDir, 'index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    external: ['ws'] // Mantiene websocket nativo como dependencia externa
});

// 4. Parchear el package.json de wisp para forzar el punto de entrada al bundle generado
const pkgPath = path.join(wispDir, 'package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.main = './dist/index.js';
    pkg.module = './dist/index.js';
    pkg.type = 'module';
    pkg.exports = {
        ".": "./dist/index.js"
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log('[BUILD-WISP] Bundle compilado correctamente en dist/index.js');