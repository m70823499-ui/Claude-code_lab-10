/* ============================================================
   foros.js — Foros de discusión por hilos (solo local).

   Depende de window.Auth (sesión). Vive dentro de la pestaña
   "Foros" de la sección Comunidad; comunidad.js decide cuándo
   mostrarlo y le pide el HTML de la columna principal.

   Navegación tipo foro clásico:
     - Vista LISTA: temas con buscador, filtro por categoría (con
       contadores) y orden configurable (más activos / más recientes).
     - Vista HILO:  respuestas + citar + editar/borrar lo propio +
       cuadro para responder.
     - Vista NUEVO: formulario para crear un tema.

   Almacenamiento: localStorage['comunidad-hilos'] = [
     { id, titulo, tema, usuario, fecha, mensajes: [
         { usuario, texto, fecha, editado? } ] }
   ]  (mensajes[0] es el mensaje inicial del hilo).

   API pública (window.Foros):
     mainHTML(usuario) -> string  (columna principal según la vista)
     bind(root, usuario)          (engancha eventos; re-dibuja vía Comunidad)
   ============================================================ */
(function () {
  "use strict";

  var K_HILOS = "comunidad-hilos";

  var TEMAS = [
    { id: "general", nombre: "General" },
    { id: "cobertura", nombre: "Cobertura" },
    { id: "ofertas", nombre: "Ofertas" },
    { id: "atencion", nombre: "Atención al cliente" },
    { id: "planes", nombre: "Planes" },
  ];

  // Estado de UI (se conserva entre re-dibujos)
  var vista = "lista";      // "lista" | "hilo" | "nuevo"
  var hiloId = null;        // hilo abierto en la vista detalle
  var busqueda = "";        // texto del buscador
  var temaFiltro = "todos";
  var orden = "activos";    // "activos" | "recientes"
  var editandoIdx = null;   // índice del mensaje en edición dentro del hilo abierto

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* ---------- Almacenamiento ---------- */
  function getHilos() {
    try {
      var raw = localStorage.getItem(K_HILOS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveHilos(list) {
    try { localStorage.setItem(K_HILOS, JSON.stringify(list)); } catch (e) {}
  }
  function findHilo(id) {
    var all = getHilos();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* ---------- Utilidades ---------- */
  function temaNombre(id) {
    for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === id) return TEMAS[i].nombre;
    return "General";
  }
  function temaCount(id) {
    return getHilos().filter(function (h) { return h.tema === id; }).length;
  }
  function inicial(u) { return u ? u.charAt(0).toUpperCase() : "?"; }
  function ultimaActividad(h) {
    return h.mensajes && h.mensajes.length ? h.mensajes[h.mensajes.length - 1].fecha : h.fecha;
  }
  function nResp(h) { return h.mensajes ? Math.max(0, h.mensajes.length - 1) : 0; }
  function fmtFecha(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  function hace(iso) {
    var d = new Date(iso), s = (Date.now() - d) / 1000;
    if (isNaN(d)) return "";
    if (s < 60) return "hace un momento";
    if (s < 3600) return "hace " + Math.floor(s / 60) + " min";
    if (s < 86400) return "hace " + Math.floor(s / 3600) + " h";
    var days = Math.floor(s / 86400);
    if (days < 30) return "hace " + days + (days === 1 ? " día" : " días");
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---------- Vista: LISTA de hilos ---------- */
  function listaHTML(usuario) {
    var filtros = [{ id: "todos", nombre: "Todos" }].concat(TEMAS).map(function (t) {
      var n = t.id === "todos" ? getHilos().length : temaCount(t.id);
      return '<button type="button" class="com-filtro' + (temaFiltro === t.id ? " active" : "") +
        '" data-foro-tema="' + t.id + '">' + esc(t.nombre) +
        ' <span class="foro-filtro-count">' + n + "</span></button>";
    }).join("");

    var hilos = getHilos().slice()
      .filter(function (h) { return temaFiltro === "todos" || h.tema === temaFiltro; })
      .sort(function (a, b) {
        return orden === "recientes"
          ? new Date(b.fecha) - new Date(a.fecha)
          : new Date(ultimaActividad(b)) - new Date(ultimaActividad(a));
      });

    var totalTemas = getHilos().length;

    var cards;
    if (!hilos.length) {
      cards = '<div class="com-empty"><span class="com-empty-icon">🗨️</span><p>' +
        (totalTemas ? "No hay temas en esta categoría todavía." :
          "Aún no hay temas de discusión. ¡Abre el primero!") + "</p></div>";
    } else {
      cards = hilos.map(function (h) {
        return '<button type="button" class="foro-hilo" data-hilo="' + esc(h.id) +
            '" data-titulo="' + esc(h.titulo.toLowerCase()) + '">' +
          '<div class="foro-hilo-main">' +
            '<span class="foro-tema-pill tema-' + esc(h.tema) + '">' + esc(temaNombre(h.tema)) + "</span>" +
            '<span class="foro-hilo-titulo">' + esc(h.titulo) + "</span>" +
            '<span class="foro-hilo-meta">por <strong>' + esc(h.usuario) + "</strong> · " + esc(hace(h.fecha)) + "</span>" +
          "</div>" +
          '<div class="foro-hilo-stats">' +
            '<span class="foro-stat"><strong>' + nResp(h) + "</strong>" + (nResp(h) === 1 ? " respuesta" : " respuestas") + "</span>" +
            '<span class="foro-stat-act">Últ. actividad ' + esc(hace(ultimaActividad(h))) + "</span>" +
          "</div>" +
        "</button>";
      }).join("");
    }

    var nuevoBtn = usuario
      ? '<button type="button" class="btn btn-primary" id="foro-nuevo-btn">+ Nuevo tema</button>'
      : '<span class="foro-login-hint">Inicia sesión para abrir un tema</span>';

    return '<div class="foro">' +
      '<div class="foro-top">' +
        '<h3 class="com-list-title">Foros de discusión <span class="com-count">' + totalTemas + "</span></h3>" +
        nuevoBtn +
      "</div>" +
      '<div class="foro-controls">' +
        '<input type="search" id="foro-buscar" class="foro-search" placeholder="Buscar tema por título…" value="' + esc(busqueda) + '">' +
        '<label class="foro-orden-wrap">Ordenar:' +
          '<select id="foro-orden" class="foro-orden">' +
            '<option value="activos"' + (orden === "activos" ? " selected" : "") + '>Más activos</option>' +
            '<option value="recientes"' + (orden === "recientes" ? " selected" : "") + '>Más recientes</option>' +
          "</select></label>" +
      "</div>" +
      '<div class="com-filtros foro-filtros">' + filtros + "</div>" +
      '<div class="foro-lista" id="foro-lista">' + cards + "</div>" +
      '<div class="com-empty foro-nores" id="foro-nores" hidden><span class="com-empty-icon">🔍</span><p>Ningún tema coincide con tu búsqueda.</p></div>' +
    "</div>";
  }

  /* ---------- Vista: NUEVO tema ---------- */
  function nuevoHTML() {
    var opts = TEMAS.map(function (t) {
      return '<option value="' + t.id + '">' + esc(t.nombre) + "</option>";
    }).join("");
    return '<div class="foro">' +
      '<button type="button" class="foro-back" id="foro-cancelar">← Volver a los temas</button>' +
      '<h3 class="com-list-title" style="margin:6px 0 14px">Abrir un nuevo tema</h3>' +
      '<form class="com-form" id="foro-nuevo-form">' +
        '<label class="com-field"><span>Título del tema</span>' +
          '<input type="text" id="foro-nuevo-titulo" maxlength="100" placeholder="Ej.: ¿Cómo es la cobertura de Tigo en Medellín?" required></label>' +
        '<label class="com-field"><span>Categoría</span>' +
          '<select id="foro-nuevo-tema" class="foro-select">' + opts + "</select></label>" +
        '<label class="com-field"><span>Tu mensaje</span>' +
          '<textarea id="foro-nuevo-mensaje" rows="4" maxlength="1000" placeholder="Cuenta tu caso o tu pregunta…" required></textarea></label>' +
        '<button type="submit" class="btn btn-primary">Publicar tema</button>' +
        '<p class="com-msg" id="foro-nuevo-msg" role="alert"></p>' +
      "</form>" +
    "</div>";
  }

  /* ---------- Vista: HILO (detalle) ---------- */
  function mensajeHTML(h, m, i, usuario) {
    var esPropio = usuario && m.usuario === usuario;
    var esOP = i === 0;

    // Modo edición para este mensaje
    if (esPropio && editandoIdx === i) {
      return '<article class="foro-msg' + (esOP ? " op" : "") + '">' +
        '<form class="com-form foro-edit-form" data-edit-idx="' + i + '">' +
          '<textarea class="foro-edit-text" rows="3" maxlength="1000" required>' + esc(m.texto) + "</textarea>" +
          '<div class="foro-edit-actions">' +
            '<button type="submit" class="btn btn-primary">Guardar</button>' +
            '<button type="button" class="btn btn-ghost" data-edit-cancel>Cancelar</button>' +
          "</div>" +
        "</form>" +
      "</article>";
    }

    // Acciones disponibles
    var acciones = "";
    if (usuario) acciones += '<button type="button" class="foro-mini" data-msg-quote="' + i + '">Citar</button>';
    if (esPropio) {
      acciones += '<button type="button" class="foro-mini" data-msg-edit="' + i + '">Editar</button>';
      if (!esOP) acciones += '<button type="button" class="foro-mini mini-danger" data-msg-del="' + i + '">Borrar</button>';
    }

    return '<article class="foro-msg' + (esOP ? " op" : "") + '">' +
      '<div class="foro-msg-head">' +
        '<span class="com-avatar">' + esc(inicial(m.usuario)) + "</span>" +
        '<div class="com-item-meta">' +
          '<span class="com-item-user">' + esc(m.usuario) + (esOP ? ' <span class="foro-op-tag">autor</span>' : "") + "</span>" +
          '<span class="com-item-date">' + esc(fmtFecha(m.fecha)) + (m.editado ? ' <span class="com-editado">(editado)</span>' : "") + "</span>" +
        "</div>" +
      "</div>" +
      '<p class="com-item-text">' + esc(m.texto) + "</p>" +
      (acciones ? '<div class="foro-msg-actions">' + acciones + "</div>" : "") +
    "</article>";
  }

  function hiloHTML(usuario) {
    var h = findHilo(hiloId);
    if (!h) { vista = "lista"; editandoIdx = null; return listaHTML(usuario); }

    var mensajes = (h.mensajes || []).map(function (m, i) { return mensajeHTML(h, m, i, usuario); }).join("");

    var responder = usuario
      ? '<form class="com-form foro-reply" id="foro-reply-form">' +
          '<label class="com-field"><span>Responder en este tema</span>' +
            '<textarea id="foro-reply-texto" rows="3" maxlength="1000" placeholder="Escribe tu respuesta…" required></textarea></label>' +
          '<button type="submit" class="btn btn-primary">Responder</button>' +
          '<p class="com-msg" id="foro-reply-msg" role="alert"></p>' +
        "</form>"
      : '<p class="foro-login-hint foro-reply-hint">Inicia sesión para responder en este tema.</p>';

    var borrarTema = (usuario && h.usuario === usuario)
      ? '<button type="button" class="foro-mini mini-danger" id="foro-borrar-tema">Borrar tema</button>'
      : "";

    return '<div class="foro">' +
      '<button type="button" class="foro-back" id="foro-volver">← Volver a los temas</button>' +
      '<div class="foro-hilo-header">' +
        '<div class="foro-hilo-header-top">' +
          '<span class="foro-tema-pill tema-' + esc(h.tema) + '">' + esc(temaNombre(h.tema)) + "</span>" +
          borrarTema +
        "</div>" +
        '<h3 class="foro-detalle-titulo">' + esc(h.titulo) + "</h3>" +
        '<span class="foro-hilo-meta">Abierto por <strong>' + esc(h.usuario) + "</strong> · " + esc(fmtFecha(h.fecha)) +
          " · " + nResp(h) + (nResp(h) === 1 ? " respuesta" : " respuestas") + "</span>" +
      "</div>" +
      '<div class="foro-msgs">' + mensajes + "</div>" +
      responder +
    "</div>";
  }

  /* ---------- HTML principal según la vista ---------- */
  function mainHTML(usuario) {
    if (vista === "nuevo" && usuario) return nuevoHTML();
    if (vista === "hilo") return hiloHTML(usuario);
    return listaHTML(usuario);
  }

  function rerender() { if (window.Comunidad) window.Comunidad.render(); }

  function setMsg(id, texto, ok) {
    var el = document.getElementById(id);
    if (el) { el.textContent = texto || ""; el.className = "com-msg" + (ok ? " ok" : texto ? " err" : ""); }
  }

  /* ---------- Búsqueda en vivo (sin re-dibujar, no pierde foco) ---------- */
  function applySearch() {
    var lista = document.getElementById("foro-lista");
    var nores = document.getElementById("foro-nores");
    if (!lista) return;
    var q = busqueda.trim().toLowerCase();
    var cards = lista.querySelectorAll(".foro-hilo");
    var visibles = 0;
    cards.forEach(function (c) {
      var match = !q || (c.getAttribute("data-titulo") || "").indexOf(q) !== -1;
      c.style.display = match ? "" : "none";
      if (match) visibles++;
    });
    if (nores) nores.hidden = !(q && cards.length && visibles === 0);
  }

  /* ---------- Mutaciones sobre un hilo ---------- */
  function conHilo(fn) {
    var all = getHilos();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === hiloId) { fn(all[i], all, i); break; }
    }
    saveHilos(all);
  }

  /* ---------- Enganche de eventos ---------- */
  function bind(root, usuario) {
    if (!root) return;

    // Filtro por categoría
    root.querySelectorAll("[data-foro-tema]").forEach(function (b) {
      b.addEventListener("click", function () { temaFiltro = b.getAttribute("data-foro-tema"); rerender(); });
    });

    // Abrir un hilo
    root.querySelectorAll(".foro-hilo").forEach(function (b) {
      b.addEventListener("click", function () { hiloId = b.getAttribute("data-hilo"); vista = "hilo"; editandoIdx = null; rerender(); });
    });

    // Orden
    var ordenSel = document.getElementById("foro-orden");
    if (ordenSel) ordenSel.addEventListener("change", function () { orden = ordenSel.value; rerender(); });

    // Buscador (en vivo, sin re-dibujar)
    var buscar = document.getElementById("foro-buscar");
    if (buscar) {
      buscar.addEventListener("input", function () { busqueda = buscar.value; applySearch(); });
      applySearch();
    }

    // Ir a "nuevo tema"
    var nuevoBtn = document.getElementById("foro-nuevo-btn");
    if (nuevoBtn) nuevoBtn.addEventListener("click", function () { vista = "nuevo"; rerender(); });

    // Cancelar / volver
    var cancelar = document.getElementById("foro-cancelar");
    if (cancelar) cancelar.addEventListener("click", function () { vista = "lista"; rerender(); });
    var volver = document.getElementById("foro-volver");
    if (volver) volver.addEventListener("click", function () { vista = "lista"; hiloId = null; editandoIdx = null; rerender(); });

    // Crear tema nuevo
    var nuevoForm = document.getElementById("foro-nuevo-form");
    if (nuevoForm) {
      nuevoForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!usuario) { setMsg("foro-nuevo-msg", "Debes iniciar sesión para publicar.", false); return; }
        var titulo = (document.getElementById("foro-nuevo-titulo").value || "").trim();
        var tema = document.getElementById("foro-nuevo-tema").value;
        var mensaje = (document.getElementById("foro-nuevo-mensaje").value || "").trim();
        if (titulo.length < 5) { setMsg("foro-nuevo-msg", "Ponle un título más descriptivo (mín. 5 caracteres).", false); return; }
        if (mensaje.length < 5) { setMsg("foro-nuevo-msg", "Escribe un poco más en tu mensaje.", false); return; }
        var ahora = new Date().toISOString();
        var nuevo = {
          id: "h" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          titulo: titulo, tema: tema, usuario: usuario, fecha: ahora,
          mensajes: [{ usuario: usuario, texto: mensaje, fecha: ahora }],
        };
        var all = getHilos();
        all.push(nuevo);
        saveHilos(all);
        hiloId = nuevo.id; vista = "hilo"; editandoIdx = null;
        rerender();
      });
    }

    // Responder en un hilo
    var replyForm = document.getElementById("foro-reply-form");
    if (replyForm) {
      replyForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!usuario) { setMsg("foro-reply-msg", "Debes iniciar sesión para responder.", false); return; }
        var texto = (document.getElementById("foro-reply-texto").value || "").trim();
        if (texto.length < 2) { setMsg("foro-reply-msg", "Tu respuesta está muy corta.", false); return; }
        conHilo(function (h) {
          h.mensajes = h.mensajes || [];
          h.mensajes.push({ usuario: usuario, texto: texto, fecha: new Date().toISOString() });
        });
        rerender();
      });
    }

    // Citar un mensaje (rellena el cuadro de respuesta sin re-dibujar)
    root.querySelectorAll("[data-msg-quote]").forEach(function (b) {
      b.addEventListener("click", function () {
        var h = findHilo(hiloId); if (!h) return;
        var m = h.mensajes[parseInt(b.getAttribute("data-msg-quote"), 10)];
        var ta = document.getElementById("foro-reply-texto"); if (!m || !ta) return;
        var cita = "> " + m.texto.replace(/\n/g, "\n> ") + "\n— " + m.usuario + "\n\n";
        ta.value = cita + ta.value;
        ta.focus();
        ta.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // Editar un mensaje propio
    root.querySelectorAll("[data-msg-edit]").forEach(function (b) {
      b.addEventListener("click", function () { editandoIdx = parseInt(b.getAttribute("data-msg-edit"), 10); rerender(); });
    });
    var editForm = root.querySelector(".foro-edit-form");
    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var idx = parseInt(editForm.getAttribute("data-edit-idx"), 10);
        var texto = (editForm.querySelector(".foro-edit-text").value || "").trim();
        if (texto.length < 2) return;
        conHilo(function (h) {
          if (h.mensajes[idx]) { h.mensajes[idx].texto = texto; h.mensajes[idx].editado = true; }
        });
        editandoIdx = null;
        rerender();
      });
      var cancelEdit = editForm.querySelector("[data-edit-cancel]");
      if (cancelEdit) cancelEdit.addEventListener("click", function () { editandoIdx = null; rerender(); });
    }

    // Borrar una respuesta propia
    root.querySelectorAll("[data-msg-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!window.confirm("¿Borrar esta respuesta?")) return;
        var idx = parseInt(b.getAttribute("data-msg-del"), 10);
        conHilo(function (h) { if (idx > 0 && h.mensajes[idx]) h.mensajes.splice(idx, 1); });
        editandoIdx = null;
        rerender();
      });
    });

    // Borrar el tema completo (solo el autor)
    var borrarTema = document.getElementById("foro-borrar-tema");
    if (borrarTema) {
      borrarTema.addEventListener("click", function () {
        if (!window.confirm("¿Borrar este tema y todas sus respuestas?")) return;
        var all = getHilos().filter(function (h) { return h.id !== hiloId; });
        saveHilos(all);
        vista = "lista"; hiloId = null; editandoIdx = null;
        rerender();
      });
    }
  }

  window.Foros = { mainHTML: mainHTML, bind: bind };
})();
