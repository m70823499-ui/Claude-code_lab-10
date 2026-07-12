/* Vercel serverless function: POST /api/generate  { prompt } -> { text }
   Proxies recipe generation to the Anthropic API using the server-side key in
   the ANTHROPIC_API_KEY environment variable. The browser never sees the key.

   Set ANTHROPIC_API_KEY in the Vercel project's Environment Variables. */

'use strict';

var MODEL = process.env.COOKING_MODEL || 'claude-opus-4-8';
var ENDPOINT = 'https://api.anthropic.com/v1/messages';

function readBody(req) {
  // Vercel usually pre-parses JSON bodies, but fall back to reading the stream.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise(function (resolve) {
    var raw = '';
    req.on('data', function (c) { raw += c; });
    req.on('end', function () { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }
  var key = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim();
  if (!key) {
    res.status(500).json({ error: 'Falta la variable de entorno ANTHROPIC_API_KEY en el servidor.' });
    return;
  }

  var body = await readBody(req);
  var prompt = body && body.prompt;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Falta el prompt.' });
    return;
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
      res.status(502).json({ error: msg });
      return;
    }
    var block = (data.content || []).find(function (b) { return b.type === 'text'; });
    res.status(200).json({ text: block ? block.text : '' });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo contactar a la API de Anthropic.' });
  }
};
