import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const wispDir = path.resolve('node_modules/wisp-server-node');

if (!fs.existsSync(wispDir)) {
    console.log('[BUILD-WISP] wisp-server-node no encontrado.');
    process.exit(0);
}

const distDir = path.join(wispDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// Obtención recursiva de archivos fuente TypeScript/JavaScript
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name !== 'node_modules' && item.name !== 'dist' && item.name !== '.git') {
                results = results.concat(getFiles(full));
            }
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.js')) && !item.name.endsWith('.d.ts')) {
            results.push(full);
        }
    }
    return results;
}

const files = getFiles(wispDir);

// 1. Compilación individual preservando rutas en dist/ y mapeo directo
for (const file of files) {
    const rel = path.relative(wispDir, file);
    const jsRel = rel.replace(/\.(ts|js)$/, '.js');

    const out1 = path.join(distDir, jsRel);
    const out2 = path.join(distDir, jsRel.replace(/^src[\\\/]/, ''));

    for (const outFile of [out1, out2]) {
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        try {
            buildSync({
                entryPoints: [file],
                outFile: outFile,
                format: 'esm',
                platform: 'node',
                target: 'node18',
                logLevel: 'silent'
            });
        } catch (e) {}
    }
}

// 2. Generación de bundle unificado en dist/index.js
const entryCandidate = files.find(f => f.endsWith('index.ts') || f.endsWith('server.ts') || f.endsWith('index.js')) || files[0];
if (entryCandidate) {
    try {
        buildSync({
            entryPoints: [entryCandidate],
            outFile: path.join(distDir, 'index.js'),
            bundle: true,
            format: 'esm',
            platform: 'node',
            target: 'node18',
            external: ['ws'],
            logLevel: 'silent'
        });
    } catch (e) {}
}

// 3. Reconfiguración de package.json del paquete remoto
const pkgPath = path.join(wispDir, 'package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.main = './dist/index.js';
    pkg.module = './dist/index.js';
    pkg.type = 'module';
    delete pkg.exports;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log('[BUILD-WISP] Compilación y parches finalizados.');