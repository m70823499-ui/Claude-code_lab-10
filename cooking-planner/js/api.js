/* Recipe generation via the Anthropic Messages API, called directly from the
   browser so the app stays a static, double-click site (no server, no build).
   The user's API key lives only in this browser's localStorage and is sent
   solely to api.anthropic.com. The prototype used window.claude.complete();
   this is its real-world replacement. */
(function () {
  var KEY_STORAGE = 'cookingPlanner.apiKey.v1';
  var ENDPOINT = 'https://api.anthropic.com/v1/messages';
  var MODEL = 'claude-opus-4-8';

  function getKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; }
  }
  function setKey(k) {
    try { localStorage.setItem(KEY_STORAGE, (k || '').trim()); } catch (e) {}
  }
  function hasKey() { return !!getKey(); }

  // Returns the model's text output for a single-prompt completion.
  async function complete(prompt) {
    var key = getKey();
    if (!key) { var err = new Error('missing-api-key'); err.code = 'missing-api-key'; throw err; }

    var res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      var detail = '';
      try { var body = await res.json(); detail = body && body.error && body.error.message; } catch (e) {}
      var e2 = new Error('http-' + res.status + (detail ? ': ' + detail : ''));
      e2.status = res.status;
      throw e2;
    }

    var data = await res.json();
    var block = (data.content || []).find(function (b) { return b.type === 'text'; });
    return block ? block.text : '';
  }

  window.CookingAPI = { complete: complete, getKey: getKey, setKey: setKey, hasKey: hasKey };
})();
