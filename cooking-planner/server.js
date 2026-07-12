/* Cooking Planner Personal — backend.
   Serves the static app AND proxies recipe generation to the Anthropic API so
   the API key stays on the server, never in the browser. Zero dependencies —
   Node 18+ built-ins only (global fetch).

   Run:   ANTHROPIC_API_KEY=sk-ant-...  node server.js
   or put the key in cooking-planner/.env  (ANTHROPIC_API_KEY=sk-ant-...)
   then open http://localhost:3000  */

'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');

var ROOT = __dirname;
var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || '127.0.0.1'; // localhost only by default (personal app)
var MODEL = process.env.COOKING_MODEL || 'claude-opus-4-8';
var ENDPOINT = 'https://api.anthropic.com/v1/messages';

// --- API key: env var first, then an optional .env file next to this script ---
function readKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  try {
    var env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    var m = env.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch (e) {}
  return '';
}

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

function sendJSON(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    var size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > 64 * 1024) { reject(new Error('body-too-large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

// --- POST /api/generate  { prompt } -> { text } ---
async function handleGenerate(req, res) {
  var key = readKey();
  if (!key) {
    return sendJSON(res, 500, { error: 'El servidor no tiene configurada la clave ANTHROPIC_API_KEY. Revisa el README.' });
  }
  if (typeof fetch !== 'function') {
    return sendJSON(res, 500, { error: 'Se requiere Node.js 18 o superior (fetch no disponible).' });
  }

  var prompt;
  try {
    var raw = await readBody(req);
    prompt = JSON.parse(raw || '{}').prompt;
  } catch (e) {
    return sendJSON(res, 400, { error: 'Solicitud inválida.' });
  }
  if (!prompt || typeof prompt !== 'string') {
    return sendJSON(res, 400, { error: 'Falta el prompt.' });
  }

  try {
    var upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    var data = await upstream.json();
    if (!upstream.ok) {
      var msg = (data && data.error && data.error.message) || ('Error de la API (' + upstream.status + ').');
      return sendJSON(res, 502, { error: msg });
    }
    var block = (data.content || []).find(function (b) { return b.type === 'text'; });
    return sendJSON(res, 200, { text: block ? block.text : '' });
  } catch (e) {
    return sendJSON(res, 502, { error: 'No se pudo contactar a la API de Anthropic.' });
  }
}

// --- static file serving (confined to ROOT) ---
function serveStatic(req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  var filePath = path.normalize(path.join(ROOT, urlPath));
  if (filePath.indexOf(ROOT) !== 0) { res.writeHead(403); res.end('Forbidden'); return; }
  // never serve secrets
  if (path.basename(filePath) === '.env') { res.writeHead(404); res.end('Not found'); return; }

  fs.readFile(filePath, function (err, buf) {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); return; }
    var ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

var server = http.createServer(function (req, res) {
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/generate') return handleGenerate(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Method not allowed'); return; }
  return serveStatic(req, res);
});

server.listen(PORT, HOST, function () {
  var keyState = readKey() ? 'configurada' : 'FALTA (configura ANTHROPIC_API_KEY)';
  console.log('Cooking Planner corriendo en  http://' + HOST + ':' + PORT);
  console.log('Clave de API: ' + keyState);
});
