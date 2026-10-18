import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const base = path.resolve(root, `.${name}`);
    if (base !== root && !base.startsWith(`${root}${path.sep}`)) throw new Error('Outside export');
    let file;
    for (const candidate of [base, `${base}.html`, path.join(base, 'index.html')]) {
      if (await stat(candidate).then((s) => s.isFile(), () => false)) { file = candidate; break; }
    }
    if (!file) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(4173, '127.0.0.1', () => console.log('Static export: http://127.0.0.1:4173'));
