// Local preview with no AEM/EDS and no CORS change on the SearchBlox server:
// serves this repo and proxies /rest/* and /ui/v1/* (chat) to SearchBlox so the API is same-origin.
// Usage: node demo/serve.mjs https://your-searchblox-server [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const [target, portArg] = process.argv.slice(2);
if (!target) {
  console.error('Usage: node demo/serve.mjs <searchblox-url> [port]');
  process.exit(1);
}

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(portArg) || 8787;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/ui/v1/')) {
    try {
      const hasBody = !['GET', 'HEAD'].includes(req.method);
      const upstream = await fetch(`${target.replace(/\/+$/, '')}${url.pathname}${url.search}`, {
        method: req.method,
        headers: hasBody ? { 'Content-Type': req.headers['content-type'] || 'application/json' } : {},
        body: hasBody ? Buffer.concat(await Array.fromAsync(req)) : undefined,
      });
      res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (err) {
      res.writeHead(502).end(`Proxy error: ${err.message}`);
    }
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(302, { Location: `/demo/index.html${url.search}` }).end();
    return;
  }

  const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Preview: http://localhost:${PORT}  (API proxied to ${target})`);
});
