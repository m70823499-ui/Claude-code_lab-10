/* ============================================================
   comparison.js — Matriz comparativa (estilo pricing), KPIs y
   tarjetas de "cosas a tener en cuenta".
   ============================================================ */
(function () {
  "use strict";

  function fmtCOP(v) { return "$" + v.toLocaleString("es-CO"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  function flat() {
    var out = [];
    window.PLANES.operadores.forEach(function (op) {
      op.planes.forEach(function (p) { out.push({ op: op, p: p }); });
    });
    return out;
  }

  function markYes() { return '<span class="pm-mark yes" aria-label="Sí">✓</span>'; }
  function markNo() { return '<span class="pm-mark no" aria-label="No">✕</span>'; }

  /* ---------- KPIs ---------- */
  function renderKPIs() {
    var all = flat();
    var precios = all.map(function (x) { return x.p.precio; });
    var minP = Math.min.apply(null, precios);
    var maxP = Math.max.apply(null, precios);
    var minPlan = all.filter(function (x) { return x.p.precio === minP; })[0];

    // Mejor valor $/GB entre planes finitos
    var finitos = all.filter(function (x) { return !x.p.ilimitado; });
    var best = finitos.slice().sort(function (a, b) {
      return (a.p.precio / a.p.datosGB) - (b.p.precio / b.p.datosGB);
    })[0];
    var bestPpg = Math.round(best.p.precio / best.p.datosGB);

    var ofertas = all.filter(function (x) { return x.p.oferta && x.p.oferta.activa; }).length;

    var kpis = [
      { cls: "", label: "Planes comparados", value: all.length, note: "Tigo y Claro · pospago" },
      { cls: minPlan.op.id, label: "Precio más bajo", value: fmtCOP(minP), note: minPlan.op.nombre + " " + minPlan.p.nombre },
      { cls: best.op.id, label: "Mejor valor ($/GB)", value: "$" + bestPpg.toLocaleString("es-CO"), note: best.op.nombre + " " + best.p.nombre },
      { cls: "", label: "Ofertas activas", value: ofertas, note: "Promociones vigentes hoy" },
    ];

    document.getElementById("kpi-row").innerHTML = kpis.map(function (k) {
      return '<div class="kpi ' + k.cls + '">' +
        '<div class="kpi-label">' + esc(k.label) + "</div>" +
        '<div class="kpi-value">' + esc(k.value) + "</div>" +
        '<div class="kpi-note">' + esc(k.note) + "</div></div>";
    }).join("");
  }

  /* ---------- Matriz de pricing ---------- */
  function renderMatrix() {
    var all = flat();
    var cont = document.getElementById("pricing-matrix");
    var cols = "180px repeat(" + all.length + ", minmax(120px,1fr))";
    cont.style.setProperty("--pm-cols", cols);

    function row(cells, cls) {
      return '<div class="pm-row ' + (cls || "") + '">' + cells + "</div>";
    }

    // Cabecera: nombre operador + plan + insignia de precio
    var head = '<div class="pm-feature">Planes</div>';
    all.forEach(function (x) {
      head += '<div class="pm-op">' +
        '<span class="pm-op-name ' + x.op.id + '">' + esc(x.op.nombre) + "</span>" +
        '<div class="pm-plan-name">' + esc(x.p.nombre) + "</div>" +
        '<div class="price-badge ' + x.op.id + '">' +
          '<span class="pb-value">' + fmtCOP(x.p.precio) + "</span>" +
          '<span class="pb-mo">/mes</span>' +
        "</div></div>";
    });

    // Filas de características
    function featRow(label, fn) {
      var cells = '<div class="pm-feature">' + esc(label) + "</div>";
      all.forEach(function (x) { cells += '<div class="pm-cell">' + fn(x) + "</div>"; });
      return row(cells);
    }

    var body = "";
    body += featRow("Datos", function (x) {
      return x.p.ilimitado
        ? '<span class="pm-val">∞<small>hasta ' + x.p.datosCompartir + " GB compartir</small></span>"
        : '<span class="pm-val">' + x.p.datosGB + ' GB</span>';
    });
    body += featRow("Red", function (x) { return '<span class="pm-val">' + esc(x.p.red) + "</span>"; });
    body += featRow("5G", function (x) { return x.p.red5g ? markYes() : markNo(); });
    body += featRow("Minutos", function (x) { return markYes() + '<small>' + esc(x.p.minutos) + "</small>"; });
    body += featRow("SMS", function (x) { return markYes() + '<small>' + esc(x.p.sms) + "</small>"; });
    body += featRow("Streaming incluido", function (x) {
      return x.p.streaming
        ? markYes() + '<small>' + esc(x.p.streaming) + "</small>"
        : markNo();
    });
    body += featRow("Roaming", function (x) {
      return x.p.roaming ? '<span class="pm-val" style="font-size:.78rem">' + esc(x.p.roaming) + "</span>" : markNo();
    });
    body += featRow("Oferta", function (x) {
      return x.p.oferta && x.p.oferta.activa
        ? '<span class="pm-oferta">🏷️ ' + esc(x.p.oferta.descripcion) + "</span>"
        : '<span class="pm-oferta none">Sin oferta</span>';
    });
    body += featRow("Fuente", function (x) {
      return '<span class="pm-source"><a href="' + esc(x.p.fuente.url) + '" target="_blank" rel="noopener">' +
        esc(x.p.fuente.nombre) + " ↗</a></span>";
    });

    // Pie: tipo de plan (pastilla de color por operador)
    var foot = '<div class="pm-feature"></div>';
    all.forEach(function (x) {
      foot += '<div class="pm-cell"><span class="pm-pill ' + x.op.id + '">' + esc(x.op.nombre) + "</span></div>";
    });

    cont.innerHTML =
      row(head, "pm-head") + body + row(foot, "pm-foot");
  }

  /* ---------- Consideraciones ---------- */
  function renderConsideraciones() {
    var grid = document.getElementById("consideraciones-grid");
    grid.innerHTML = window.PLANES.consideraciones.map(function (c) {
      return '<article class="consid-card">' +
        '<div class="consid-icon">' + c.icono + "</div>" +
        "<h3>" + esc(c.titulo) + "</h3>" +
        "<p>" + esc(c.texto) + "</p></article>";
    }).join("");
  }

  window.Comparison = {
    render: function () { renderKPIs(); renderMatrix(); renderConsideraciones(); },
  };
})();
