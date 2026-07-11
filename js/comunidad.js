/* ============================================================
   comunidad.js — Sección "Comunidad": los usuarios registrados
   comparten experiencias sobre los planes y las leen ordenadas.

   Depende de window.Auth (registro/sesión). Los comentarios se
   guardan en localStorage; la estructura de datos está lista para
   moverla a un servidor más adelante (ver getComentarios/save).

   API pública (window.Comunidad):
     render()  -> monta la sección y se re-dibuja al cambiar la sesión.
   ============================================================ */
(function () {
  "use strict";

  var K_COMENTARIOS = "comunidad-comentarios"; // [{ id, usuario, texto, operador, estrellas, fecha }]

  // Operadores para etiquetar la experiencia (coinciden con data.js)
  var OPERADORES = [
    { id: "general", nombre: "General" },
    { id: "tigo", nombre: "Tigo" },
    { id: "claro", nombre: "Claro" },
  ];

  // Estado de UI (se conserva entre re-dibujos)
  var authTab = "login";      // "login" | "signup"
  var filtro = "todos";       // "todos" | "general" | "tigo" | "claro"

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* ---------- Almacenamiento de comentarios ---------- */
  function getComentarios() {
    try {
      var raw = localStorage.getItem(K_COMENTARIOS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveComentarios(list) {
    try { localStorage.setItem(K_COMENTARIOS, JSON.stringify(list)); } catch (e) {}
  }

  /* ---------- Utilidades ---------- */
  function nombreOperador(id) {
    for (var i = 0; i < OPERADORES.length; i++) if (OPERADORES[i].id === id) return OPERADORES[i].nombre;
    return "General";
  }
  function fmtFecha(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  function estrellas(n) {
    var full = "", empty = "";
    for (var i = 0; i < n; i++) full += "★";
    for (var j = n; j < 5; j++) empty += "☆";
    return '<span class="com-stars" aria-label="' + n + ' de 5 estrellas">' +
      '<span class="com-stars-on">' + full + "</span>" + empty + "</span>";
  }
  function inicial(usuario) { return usuario ? usuario.charAt(0).toUpperCase() : "?"; }

  /* ---------- Bloque: autenticación (sin sesión) ---------- */
  function authHTML() {
    var esLogin = authTab === "login";
    return '<div class="com-panel com-auth">' +
      '<div class="com-tabs">' +
        '<button type="button" class="com-tab' + (esLogin ? " active" : "") + '" data-tab="login">Entrar</button>' +
        '<button type="button" class="com-tab' + (!esLogin ? " active" : "") + '" data-tab="signup">Crear cuenta</button>' +
      "</div>" +
      '<form class="com-form" id="com-auth-form" autocomplete="off">' +
        '<label class="com-field"><span>Usuario</span>' +
          '<input type="text" id="com-usuario" maxlength="20" placeholder="tu_usuario" required></label>' +
        '<label class="com-field"><span>Contraseña</span>' +
          '<input type="password" id="com-pass" placeholder="••••••" required></label>' +
        '<button type="submit" class="btn btn-primary">' + (esLogin ? "Entrar" : "Crear cuenta") + "</button>" +
        '<p class="com-msg" id="com-auth-msg" role="alert"></p>' +
      "</form>" +
      '<p class="com-aviso">🔒 Prototipo local: tu usuario y comentarios se guardan solo en este navegador. No uses una contraseña real.</p>' +
    "</div>";
  }

  /* ---------- Bloque: publicar experiencia (con sesión) ---------- */
  function composerHTML(usuario) {
    var chips = OPERADORES.map(function (o, i) {
      var id = "com-op-" + o.id;
      return '<span class="opt">' +
        '<input type="radio" name="com-operador" id="' + id + '" value="' + o.id + '"' + (i === 0 ? " checked" : "") + ">" +
        '<label for="' + id + '">' + esc(o.nombre) + "</label></span>";
    }).join("");

    // Selector de estrellas (radios; 5 marcado por defecto)
    var stars = "";
    for (var v = 5; v >= 1; v--) {
      stars += '<input type="radio" name="com-estrellas" id="com-star-' + v + '" value="' + v + '"' + (v === 5 ? " checked" : "") + ">" +
        '<label for="com-star-' + v + '" title="' + v + ' de 5">★</label>';
    }

    return '<div class="com-panel com-composer">' +
      '<div class="com-userbar">' +
        '<span class="com-avatar">' + esc(inicial(usuario)) + "</span>" +
        '<span class="com-hi">Hola, <strong>' + esc(usuario) + "</strong></span>" +
        '<button type="button" class="btn btn-ghost" id="com-logout">Salir</button>' +
      "</div>" +
      '<form class="com-form" id="com-post-form">' +
        '<label class="com-field"><span>Comparte tu experiencia o pregunta</span>' +
          '<textarea id="com-texto" rows="3" maxlength="600" placeholder="¿Cómo te ha ido con tu plan? ¿Cobertura, atención, ofertas...?" required></textarea></label>' +
        '<div class="com-row">' +
          '<div class="com-sub"><span class="com-sub-lbl">Operador</span><div class="opt-group">' + chips + "</div></div>" +
          '<div class="com-sub"><span class="com-sub-lbl">Tu valoración</span><div class="com-stars-input">' + stars + "</div></div>" +
        "</div>" +
        '<button type="submit" class="btn btn-primary">Publicar</button>' +
        '<p class="com-msg" id="com-post-msg" role="alert"></p>' +
      "</form>" +
    "</div>";
  }

  /* ---------- Bloque: lista de comentarios ---------- */
  function listHTML() {
    var all = getComentarios().slice().sort(function (a, b) {
      return new Date(b.fecha) - new Date(a.fecha); // más recientes primero
    });
    var visibles = filtro === "todos" ? all : all.filter(function (c) { return c.operador === filtro; });

    var filtros = [{ id: "todos", nombre: "Todos" }].concat(OPERADORES).map(function (o) {
      return '<button type="button" class="com-filtro' + (filtro === o.id ? " active" : "") +
        '" data-filtro="' + o.id + '">' + esc(o.nombre) + "</button>";
    }).join("");

    var items;
    if (!visibles.length) {
      items = '<div class="com-empty"><span class="com-empty-icon">💬</span>' +
        "<p>" + (all.length ? "Nadie ha comentado sobre este operador todavía." :
          "Todavía no hay comentarios. ¡Sé el primero en compartir tu experiencia!") + "</p></div>";
    } else {
      items = visibles.map(function (c) {
        var opClass = (c.operador === "tigo" || c.operador === "claro") ? c.operador : "";
        return '<article class="com-item">' +
          '<div class="com-item-head">' +
            '<span class="com-avatar">' + esc(inicial(c.usuario)) + "</span>" +
            '<div class="com-item-meta">' +
              '<span class="com-item-user">' + esc(c.usuario) + "</span>" +
              '<span class="com-item-date">' + esc(fmtFecha(c.fecha)) + "</span>" +
            "</div>" +
            '<span class="com-op-pill ' + opClass + '">' + esc(nombreOperador(c.operador)) + "</span>" +
          "</div>" +
          estrellas(c.estrellas) +
          '<p class="com-item-text">' + esc(c.texto) + "</p>" +
        "</article>";
      }).join("");
    }

    return '<div class="com-list-wrap">' +
      '<div class="com-list-top">' +
        '<h3 class="com-list-title">Experiencias de la comunidad <span class="com-count">' + all.length + "</span></h3>" +
        '<div class="com-filtros">' + filtros + "</div>" +
      "</div>" +
      '<div class="com-list">' + items + "</div>" +
    "</div>";
  }

  /* ---------- Render principal ---------- */
  function render() {
    var root = document.getElementById("comunidad-app");
    if (!root) return;
    var usuario = window.Auth ? window.Auth.current() : null;

    root.innerHTML =
      '<div class="com-grid">' +
        (usuario ? composerHTML(usuario) : authHTML()) +
        listHTML() +
      "</div>";

    bind(usuario);
  }

  function setMsg(id, texto, ok) {
    var el = document.getElementById(id);
    if (el) { el.textContent = texto || ""; el.className = "com-msg" + (ok ? " ok" : texto ? " err" : ""); }
  }

  function bind(usuario) {
    var root = document.getElementById("comunidad-app");

    // Tabs de autenticación
    root.querySelectorAll(".com-tab").forEach(function (t) {
      t.addEventListener("click", function () { authTab = t.getAttribute("data-tab"); render(); });
    });

    // Filtros de la lista
    root.querySelectorAll(".com-filtro").forEach(function (f) {
      f.addEventListener("click", function () { filtro = f.getAttribute("data-filtro"); render(); });
    });

    // Formulario de login / registro
    var authForm = document.getElementById("com-auth-form");
    if (authForm) {
      authForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var u = document.getElementById("com-usuario").value;
        var p = document.getElementById("com-pass").value;
        var res = authTab === "login" ? window.Auth.login(u, p) : window.Auth.signup(u, p);
        if (!res.ok) { setMsg("com-auth-msg", res.error, false); return; }
        render(); // ya con sesión: muestra el compositor
      });
    }

    // Salir
    var logout = document.getElementById("com-logout");
    if (logout) logout.addEventListener("click", function () { window.Auth.logout(); render(); });

    // Publicar comentario
    var postForm = document.getElementById("com-post-form");
    if (postForm) {
      postForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var texto = (document.getElementById("com-texto").value || "").trim();
        if (texto.length < 3) { setMsg("com-post-msg", "Escribe un poco más antes de publicar.", false); return; }
        var opSel = document.querySelector('input[name="com-operador"]:checked');
        var stSel = document.querySelector('input[name="com-estrellas"]:checked');
        var list = getComentarios();
        list.push({
          id: "c" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          usuario: usuario,
          texto: texto,
          operador: opSel ? opSel.value : "general",
          estrellas: stSel ? parseInt(stSel.value, 10) : 5,
          fecha: new Date().toISOString(),
        });
        saveComentarios(list);
        render(); // refresca la lista con el nuevo comentario
      });
    }
  }

  // Re-dibuja si la sesión cambia desde otro punto (p. ej. logout)
  if (window.Auth && window.Auth.onChange) {
    window.Auth.onChange(function () {
      if (document.getElementById("comunidad-app")) render();
    });
  }

  window.Comunidad = { render: render };
})();
