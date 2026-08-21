import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

// Ruta al módulo wisp-server-node dentro de node_modules
const wispDir = path.resolve('node_modules/wisp-server-node');

if (!fs.existsSync(wispDir)) {
    console.log('[BUILD-WISP] Módulo wisp-server-node no encontrado.');
    process.exit(0);
}

const distDir = path.join(wispDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// Recorrer el directorio recursivamente ignorando carpetas no deseadas
function getAllFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
                results = results.concat(getAllFiles(fullPath));
            }
        } else if (entry.isFile()) {
            results.push(fullPath);
        }
    }
    return results;
}

const allFiles = getAllFiles(wispDir);
const codeFiles = allFiles.filter(f => 
    (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.mjs')) && 
    !f.endsWith('.d.ts')
);

console.log(`[BUILD-WISP] Transpilando ${codeFiles.length} archivos de código...`);

// Transpilar cada archivo a ES Modules en dist/
for (const file of codeFiles) {
    const relativePath = path.relative(wispDir, file);
    const jsName = relativePath.replace(/\.(ts|js|mjs)$/, '.js');
    
    const targets = [path.join(distDir, jsName)];
    
    // Si el código fuente está dentro de src/, duplicar la salida en la raíz de dist/
    if (jsName.startsWith(`src${path.sep}`)) {
        targets.push(path.join(distDir, jsName.substring(4)));
    }

    for (const outFile of targets) {
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
        } catch (e) {
            console.error(`[BUILD-WISP] Error en ${file}:`, e.message);
        }
    }
}

// Ajustar package.json para resolver las importaciones de Node ESM
const pkgPath = path.join(wispDir, 'package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    let mainFile = './dist/index.js';
    if (!fs.existsSync(path.join(distDir, 'index.js')) && fs.existsSync(path.join(distDir, 'server.js'))) {
        mainFile = './dist/server.js';
    }

    pkg.main = mainFile;
    pkg.module = mainFile;
    pkg.type = 'module';
    pkg.exports = {
        ".": mainFile,
        "./*": "./dist/*"
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log('[BUILD-WISP] Proceso finalizado correctamente.');