import http from 'node:http';
import { readFileSync } from 'node:fs';
import { metadata, recommend } from './index.mjs';

const port = Number(process.env.RASIKH_RECOMMENDER_PORT ?? 8795);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid demo port');
const page = readFileSync(new URL('./demo.html', import.meta.url));
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" }); res.end(page); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/metadata') { json(200, metadata()); return; }
  if (req.method === 'POST' && url.pathname === '/api/recommend') {
    const origin = req.headers.origin;
    if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) { json(403, { error: 'Local origin required' }); return; }
    if (!req.headers['content-type']?.startsWith('application/json')) { json(415, { error: 'JSON required' }); return; }
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 8192) { json(413, { error: 'Request too large' }); return; } }
      json(200, recommend(JSON.parse(body)));
    } catch (error) { json(400, { error: error.message }); }
    return;
  }
  json(404, { error: 'Not found' });
});
server.on('error', error => { console.error(`Recommendation demo could not start: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => process.stdout.write(`Rasikh recommendation demo: http://127.0.0.1:${port}\n`));
