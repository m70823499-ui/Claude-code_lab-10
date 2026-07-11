/* ============================================================
   charts.js — Gráficos en SVG puro (sin librerías externas).
   Se re-renderizan al cambiar de tema (colores por operador).
   ============================================================ */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function fmtCOP(v) {
    return "$" + v.toLocaleString("es-CO");
  }

  // Devuelve todos los planes aplanados con color según el tema.
  function flatPlanes(dark) {
    var out = [];
    window.PLANES.operadores.forEach(function (op) {
      op.planes.forEach(function (p) {
        out.push({
          plan: p,
          op: op,
          color: dark ? op.colorDark : op.color,
          etiqueta: op.nombre + " " + p.nombre,
        });
      });
    });
    return out;
  }

  // Tooltip nativo por marca (title). Simple, accesible, sin dependencias.
  function withTitle(node, text) {
    node.appendChild(el("title", null, text));
    return node;
  }

  /* -------- Gráfico de barras horizontales -------- */
  function horizontalBars(containerId, items, opts) {
    opts = opts || {};
    var cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = "";

    var W = 560;
    var rowH = 40, padTop = 10, padBottom = 24;
    var labelW = 148, valueW = 74;
    var plotX = labelW, plotW = W - labelW - valueW;
    var H = padTop + items.length * rowH + padBottom;

    var max = 0;
    items.forEach(function (it) { if (it.value > max) max = it.value; });
    max = max * 1.02 || 1;

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.setAttribute("aria-label", opts.aria || "Gráfico de barras");

    // Líneas de guía verticales
    var ticks = 4;
    for (var t = 0; t <= ticks; t++) {
      var gx = plotX + (plotW * t) / ticks;
      svg.appendChild(el("line", {
        x1: gx, y1: padTop, x2: gx, y2: H - padBottom, class: "grid-line",
      }));
      if (opts.axisFmt) {
        svg.appendChild(el("text", {
          x: gx, y: H - padBottom + 14, class: "axis-text", "text-anchor": "middle",
        }, opts.axisFmt((max * t) / ticks)));
      }
    }

    items.forEach(function (it, i) {
      var y = padTop + i * rowH;
      var barH = 20, barY = y + (rowH - barH) / 2;
      var w = Math.max(2, (it.value / max) * plotW);

      // Nombre del plan
      svg.appendChild(el("text", {
        x: 0, y: barY + barH / 2 + 4, class: "bar-name",
      }, it.label));

      // Pista tenue
      svg.appendChild(el("rect", {
        x: plotX, y: barY, width: plotW, height: barH, rx: 5,
        fill: "currentColor", opacity: ".06",
      }));

      // Barra (extremo redondeado, anclada a la base)
      var bar = el("rect", {
        x: plotX, y: barY, width: w, height: barH, rx: 5, fill: it.color,
      });
      withTitle(bar, it.etiqueta + " · " + it.display);
      svg.appendChild(bar);

      // Etiqueta de valor al final
      svg.appendChild(el("text", {
        x: plotX + w + 8, y: barY + barH / 2 + 4, class: "bar-label",
      }, it.display));
    });

    cont.appendChild(svg);
  }

  /* -------- Gráfico de dispersión (precio vs GB) -------- */
  function scatter(containerId, dark) {
    var cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = "";

    var data = flatPlanes(dark).map(function (d) {
      var gb = d.plan.ilimitado ? d.plan.datosCompartir : d.plan.datosGB;
      return {
        x: d.plan.precio,
        y: gb,
        color: d.color,
        ilim: d.plan.ilimitado,
        nombre: d.op.nombre + " " + d.plan.nombre,
        display: fmtCOP(d.plan.precio) + " · " + (d.plan.ilimitado ? "∞ (" + gb + " compartir)" : gb + " GB"),
      };
    });

    var W = 560, H = 320;
    var m = { top: 16, right: 18, bottom: 42, left: 52 };
    var pw = W - m.left - m.right, ph = H - m.top - m.bottom;

    var maxX = 120000, maxY = 140; // topes redondeados para ambos operadores

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.setAttribute("aria-label", "Dispersión de precio contra datos por plan");

    function px(v) { return m.left + (v / maxX) * pw; }
    function py(v) { return m.top + ph - (v / maxY) * ph; }

    // Rejilla + ejes
    var xt = 4, yt = 4, i;
    for (i = 0; i <= yt; i++) {
      var yy = m.top + (ph * i) / yt;
      svg.appendChild(el("line", { x1: m.left, y1: yy, x2: W - m.right, y2: yy, class: "grid-line" }));
      svg.appendChild(el("text", { x: m.left - 8, y: yy + 4, class: "axis-text", "text-anchor": "end" },
        Math.round(maxY - (maxY * i) / yt) + ""));
    }
    for (i = 0; i <= xt; i++) {
      var xx = m.left + (pw * i) / xt;
      svg.appendChild(el("text", { x: xx, y: H - m.bottom + 16, class: "axis-text", "text-anchor": "middle" },
        "$" + Math.round((maxX * i) / xt / 1000) + "k"));
    }
    svg.appendChild(el("line", { x1: m.left, y1: m.top, x2: m.left, y2: m.top + ph, class: "axis-line" }));
    svg.appendChild(el("line", { x1: m.left, y1: m.top + ph, x2: W - m.right, y2: m.top + ph, class: "axis-line" }));

    // Rótulos de eje
    svg.appendChild(el("text", { x: m.left + pw / 2, y: H - 6, class: "axis-text", "text-anchor": "middle" }, "Precio mensual (COP)"));
    var yl = el("text", { x: 14, y: m.top + ph / 2, class: "axis-text", "text-anchor": "middle",
      transform: "rotate(-90 14 " + (m.top + ph / 2) + ")" }, "Datos (GB)");
    svg.appendChild(yl);

    data.forEach(function (d) {
      var cx = px(d.x), cy = py(d.y);
      var g = el("g", null);
      var dot = el("circle", { cx: cx, cy: cy, r: 8, fill: d.color, stroke: "var(--card)", "stroke-width": 2 });
      withTitle(dot, d.nombre + " — " + d.display);
      g.appendChild(dot);
      if (d.ilim) {
        g.appendChild(el("text", { x: cx, y: cy + 4, "text-anchor": "middle",
          fill: "#fff", "font-size": "11", "font-weight": "800" }, "∞"));
      }
      // Etiqueta corta
      g.appendChild(el("text", { x: cx, y: cy - 12, class: "dot-label", "text-anchor": "middle" },
        d.nombre.split(" ")[0]));
      svg.appendChild(g);
    });

    cont.appendChild(svg);
  }

  /* -------- Render de todo el dashboard -------- */
  function render(dark) {
    var items = flatPlanes(dark);

    // 1) Precio mensual
    horizontalBars("chart-precio", items.map(function (d) {
      return {
        label: d.op.nombre + " " + shortName(d.plan),
        value: d.plan.precio, color: d.color,
        display: fmtCOP(d.plan.precio), etiqueta: d.etiqueta,
      };
    }), { aria: "Precio mensual por plan", axisFmt: function (v) { return "$" + Math.round(v / 1000) + "k"; } });

    // 2) GB incluidos (ilimitado -> usa datosCompartir con marca ∞)
    horizontalBars("chart-gb", items.map(function (d) {
      var gb = d.plan.ilimitado ? d.plan.datosCompartir : d.plan.datosGB;
      return {
        label: d.op.nombre + " " + shortName(d.plan),
        value: gb, color: d.color,
        display: d.plan.ilimitado ? "∞ " + gb : gb + " GB", etiqueta: d.etiqueta,
      };
    }), { aria: "Datos incluidos por plan", axisFmt: function (v) { return Math.round(v) + ""; } });

    // 3) Precio por GB (solo planes con GB definidos)
    var finitos = items.filter(function (d) { return !d.plan.ilimitado; });
    horizontalBars("chart-valor", finitos.map(function (d) {
      var ppg = Math.round(d.plan.precio / d.plan.datosGB);
      return {
        label: d.op.nombre + " " + shortName(d.plan),
        value: ppg, color: d.color,
        display: "$" + ppg.toLocaleString("es-CO") + "/GB", etiqueta: d.etiqueta,
      };
    }), { aria: "Precio por GB", axisFmt: function (v) { return "$" + Math.round(v); } });

    // 4) Dispersión
    scatter("chart-dispersion", dark);
  }

  function shortName(p) {
    // "Móvil 65 GB" -> "65 GB"; "GB Ilimitadas + Redes" -> "Ilimitado"
    if (p.ilimitado) return "Ilimitado";
    var m = p.nombre.match(/\d+\s?GB/);
    return m ? m[0] : p.nombre;
  }

  window.Charts = { render: render };
})();
