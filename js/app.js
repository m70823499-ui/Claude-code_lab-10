/* ============================================================
   app.js — Orquestador: tema, fecha, leyenda y arranque.
   ============================================================ */
(function () {
  "use strict";

  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function fmtFecha(iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderLegend() {
    var leg = document.getElementById("legend");
    if (!leg) return;
    var dark = isDark();
    leg.innerHTML = window.PLANES.operadores.map(function (op) {
      var c = dark ? op.colorDark : op.color;
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + c + '"></span>' +
        op.nombre + "</span>";
    }).join("");
  }

  function renderCharts() {
    if (window.Charts) window.Charts.render(isDark());
    renderLegend();
  }

  function initTheme() {
    var btn = document.getElementById("theme-toggle");
    var saved = null;
    try { saved = localStorage.getItem("planes-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    updateThemeIcon();

    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("planes-theme", next); } catch (e) {}
      updateThemeIcon();
      renderCharts(); // los colores de las barras cambian con el tema
    });

    // Si el sistema cambia y no hay preferencia guardada, re-render
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!document.documentElement.getAttribute("data-theme")) renderCharts();
      });
    }
  }

  function updateThemeIcon() {
    var icon = document.querySelector(".theme-icon");
    if (icon) icon.textContent = isDark() ? "☀️" : "🌙";
  }

  function init() {
    // Fechas y disclaimer
    var fecha = fmtFecha(window.PLANES.actualizado);
    document.getElementById("fecha-actualizacion").textContent = fecha;
    document.getElementById("disclaimer").textContent = window.PLANES.disclaimer;
    var ff = document.getElementById("footer-fecha");
    if (ff) ff.textContent = "Datos actualizados al " + fecha + ".";

    // Secciones
    if (window.Comparison) window.Comparison.render();
    if (window.Recommender) window.Recommender.render();
    renderCharts();
    initTheme();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
