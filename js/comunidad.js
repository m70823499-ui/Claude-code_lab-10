/* ============================================================
   comunidad.js — Sección "Comunidad". Dos pestañas:
     • Experiencias: muro de comentarios con estrellas (por operador).
     • Foros: hilos de discusión por tema (ver js/foros.js).

   Depende de window.Auth (sesión) y window.Foros (pestaña Foros).
   El panel de login/registro (izquierda) es compartido por ambas
   pestañas. Todo se guarda en localStorage; la estructura de datos
   está lista para moverla a un servidor más adelante.

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
  var mainTab = "experiencias"; // "experiencias" | "foros"
  var authTab = "login";        // "login" | "signup"
  var filtro = "todos";         // "todos" | "general" | "tigo" | "claro"
  var editandoComentario = null; // id del comentario en edición

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

  /* ---------- Panel de sesión (columna izquierda, compartido) ---------- */
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

  function userbarHTML(usuario) {
    return '<div class="com-userbar">' +
      '<span class="com-avatar">' + esc(inicial(usuario)) + "</span>" +
      '<span class="com-hi">Hola, <strong>' + esc(usuario) + "</strong></span>" +
      '<button type="button" class="btn btn-ghost" id="com-logout">Salir</button>' +
    "</div>";
  }

  // Compositor del muro de experiencias (solo pestaña Experiencias)
  function composerFormHTML() {
    var chips = OPERADORES.map(function (o, i) {
      var id = "com-op-" + o.id;
      return '<span class="opt">' +
        '<input type="radio" name="com-operador" id="' + id + '" value="' + o.id + '"' + (i === 0 ? " checked" : "") + ">" +
        '<label for="' + id + '">' + esc(o.nombre) + "</label></span>";
    }).join("");

    var stars = "";
    for (var v = 5; v >= 1; v--) {
      stars += '<input type="radio" name="com-estrellas" id="com-star-' + v + '" value="' + v + '"' + (v === 5 ? " checked" : "") + ">" +
        '<label for="com-star-' + v + '" title="' + v + ' de 5">★</label>';
    }

    return '<form class="com-form" id="com-post-form">' +
      '<label class="com-field"><span>Comparte tu experiencia o pregunta</span>' +
        '<textarea id="com-texto" rows="3" maxlength="600" placeholder="¿Cómo te ha ido con tu plan? ¿Cobertura, atención, ofertas...?" required></textarea></label>' +
      '<div class="com-row">' +
        '<div class="com-sub"><span class="com-sub-lbl">Operador</span><div class="opt-group">' + chips + "</div></div>" +
        '<div class="com-sub"><span class="com-sub-lbl">Tu valoración</span><div class="com-stars-input">' + stars + "</div></div>" +
      "</div>" +
      '<button type="submit" class="btn btn-primary">Publicar</button>' +
      '<p class="com-msg" id="com-post-msg" role="alert"></p>' +
    "</form>";
  }

  // Columna izquierda: login (sin sesión) o barra de usuario (+ compositor en Experiencias)
  function sessionColumn(usuario) {
    if (!usuario) return authHTML(); // ya es un .com-panel
    var extra = mainTab === "experiencias" ? composerFormHTML() : "";
    return '<div class="com-panel com-composer">' + userbarHTML(usuario) + extra + "</div>";
  }

  /* ---------- Muro de experiencias (pestaña Experiencias) ---------- */
  function comentarioHTML(c, usuario) {
    var opClass = (c.operador === "tigo" || c.operador === "claro") ? c.operador : "";
    var esPropio = usuario && c.usuario === usuario;

    var cabecera = '<div class="com-item-head">' +
      '<span class="com-avatar">' + esc(inicial(c.usuario)) + "</span>" +
      '<div class="com-item-meta">' +
        '<span class="com-item-user">' + esc(c.usuario) + "</span>" +
        '<span class="com-item-date">' + esc(fmtFecha(c.fecha)) + (c.editado ? ' <span class="com-editado">(editado)</span>' : "") + "</span>" +
      "</div>" +
      '<span class="com-op-pill ' + opClass + '">' + esc(nombreOperador(c.operador)) + "</span>" +
    "</div>";

    // Modo edición
    if (esPropio && editandoComentario === c.id) {
      return '<article class="com-item">' + cabecera +
        '<form class="com-form com-edit-form" data-edit-id="' + esc(c.id) + '">' +
          '<textarea class="com-edit-text" rows="3" maxlength="600" required>' + esc(c.texto) + "</textarea>" +
          '<div class="foro-edit-actions">' +
            '<button type="submit" class="btn btn-primary">Guardar</button>' +
            '<button type="button" class="btn btn-ghost" data-edit-cancel>Cancelar</button>' +
          "</div>" +
        "</form>" +
      "</article>";
    }

    var acciones = esPropio
      ? '<div class="com-item-actions">' +
          '<button type="button" class="foro-mini" data-com-edit="' + esc(c.id) + '">Editar</button>' +
          '<button type="button" class="foro-mini mini-danger" data-com-del="' + esc(c.id) + '">Borrar</button>' +
        "</div>"
      : "";

    return '<article class="com-item">' + cabecera +
      estrellas(c.estrellas) +
      '<p class="com-item-text">' + esc(c.texto) + "</p>" +
      acciones +
    "</article>";
  }

  function listHTML(usuario) {
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
      items = visibles.map(function (c) { return comentarioHTML(c, usuario); }).join("");
    }

    return '<div class="com-list-wrap">' +
      '<div class="com-list-top">' +
        '<h3 class="com-list-title">Experiencias de la comunidad <span class="com-count">' + all.length + "</span></h3>" +
        '<div class="com-filtros">' + filtros + "</div>" +
      "</div>" +
      '<div class="com-list">' + items + "</div>" +
    "</div>";
  }

  /* ---------- Barra de pestañas principal ---------- */
  function tabsHTML() {
    function tab(id, label) {
      return '<button type="button" class="com-maintab' + (mainTab === id ? " active" : "") +
        '" data-maintab="' + id + '">' + label + "</button>";
    }
    return '<div class="com-maintabs">' +
      tab("experiencias", "💬 Experiencias") +
      tab("foros", "🗨️ Foros") +
    "</div>";
  }

  /* ---------- Render principal ---------- */
  function render() {
    var root = document.getElementById("comunidad-app");
    if (!root) return;
    var usuario = window.Auth ? window.Auth.current() : null;

    var mainContent = mainTab === "foros" && window.Foros
      ? window.Foros.mainHTML(usuario)
      : listHTML(usuario);

    root.innerHTML =
      tabsHTML() +
      '<div class="com-grid">' +
        sessionColumn(usuario) +
        '<div class="com-main">' + mainContent + "</div>" +
      "</div>";

    bind(usuario);
  }

  function setMsg(id, texto, ok) {
    var el = document.getElementById(id);
    if (el) { el.textContent = texto || ""; el.className = "com-msg" + (ok ? " ok" : texto ? " err" : ""); }
  }

  function bind(usuario) {
    var root = document.getElementById("comunidad-app");

    // Pestañas principales
    root.querySelectorAll(".com-maintab").forEach(function (t) {
      t.addEventListener("click", function () { mainTab = t.getAttribute("data-maintab"); render(); });
    });

    // Tabs de autenticación
    root.querySelectorAll(".com-tab").forEach(function (t) {
      t.addEventListener("click", function () { authTab = t.getAttribute("data-tab"); render(); });
    });

    // Filtros del muro
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
        render();
      });
    }

    // Salir
    var logout = document.getElementById("com-logout");
    if (logout) logout.addEventListener("click", function () { window.Auth.logout(); render(); });

    // Publicar comentario (muro)
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
        render();
      });
    }

    // Editar comentario propio (muro)
    root.querySelectorAll("[data-com-edit]").forEach(function (b) {
      b.addEventListener("click", function () { editandoComentario = b.getAttribute("data-com-edit"); render(); });
    });
    var editForm = root.querySelector(".com-edit-form");
    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var id = editForm.getAttribute("data-edit-id");
        var texto = (editForm.querySelector(".com-edit-text").value || "").trim();
        if (texto.length < 3) return;
        var list = getComentarios();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) { list[i].texto = texto; list[i].editado = true; break; }
        }
        saveComentarios(list);
        editandoComentario = null;
        render();
      });
      var cancelEdit = editForm.querySelector("[data-edit-cancel]");
      if (cancelEdit) cancelEdit.addEventListener("click", function () { editandoComentario = null; render(); });
    }

    // Borrar comentario propio (muro)
    root.querySelectorAll("[data-com-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!window.confirm("¿Borrar tu comentario?")) return;
        var id = b.getAttribute("data-com-del");
        saveComentarios(getComentarios().filter(function (c) { return c.id !== id; }));
        editandoComentario = null;
        render();
      });
    });

    // Pestaña Foros: delega el enganche de sus eventos
    if (mainTab === "foros" && window.Foros) {
      window.Foros.bind(root.querySelector(".com-main"), usuario);
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
