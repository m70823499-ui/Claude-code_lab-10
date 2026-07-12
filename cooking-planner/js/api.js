/* Recipe generation client.
   Calls the app's own backend (/api/generate), which proxies to the Anthropic
   API using a server-side key. The browser never sees or handles the key.
   (In the prototype this was window.claude.complete(); now it's our backend.) */
(function () {
  // Relative URL so it works whatever path the app is served under.
  var ENDPOINT = 'api/generate';

  async function complete(prompt) {
    var res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
    } catch (e) {
      throw new Error('network'); // server not running / no connection
    }

    var data = null;
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      var msg = (data && data.error) || ('error-' + res.status);
      var err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return (data && data.text) || '';
  }

  window.CookingAPI = { complete: complete };
})();
