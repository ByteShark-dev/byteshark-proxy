import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const wispDir = path.resolve('node_modules/wisp-server-node');

if (!fs.existsSync(wispDir)) {
    console.log('[BUILD-WISP] Módulo wisp-server-node no encontrado.');
    process.exit(0);
}

const distDir = path.join(wispDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });

function findTsFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist') {
                results = results.concat(findTsFiles(fullPath));
            }
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

const tsFiles = findTsFiles(wispDir);

for (const file of tsFiles) {
    const relativePath = path.relative(wispDir, file);
    const targetPath = relativePath.replace(/\.ts$/, '.js');
    const outFile = path.join(distDir, targetPath);

    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    buildSync({
        entryPoints: [file],
        outFile: outFile,
        format: 'esm',
        platform: 'node',
        target: 'node18',
        logLevel: 'silent'
    });
}

console.log(`[BUILD-WISP] Compilados ${tsFiles.length} archivos TypeScript en dist/`);