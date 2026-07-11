/* ============================================================
   recommender.js — Cuestionario + motor de recomendación.
   Puntaje transparente: cada plan suma puntos según tus respuestas
   y se muestran las razones concretas (sin caja negra).
   ============================================================ */
(function () {
  "use strict";

  function fmtCOP(v) { return "$" + v.toLocaleString("es-CO"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  var PREGUNTAS = [
    { id: "presupuesto", titulo: "¿Cuál es tu presupuesto mensual?",
      opciones: [
        { v: "bajo", t: "Hasta $55.000" },
        { v: "medio", t: "$55.000 – $80.000" },
        { v: "alto", t: "Más de $80.000" },
        { v: "libre", t: "El precio no importa" },
      ] },
    { id: "datos", titulo: "¿Cuántos datos usas al mes?",
      opciones: [
        { v: "bajo", t: "Poco (redes y chat)" },
        { v: "medio", t: "Medio (algo de video)" },
        { v: "alto", t: "Mucho (streaming diario)" },
        { v: "ilimitado", t: "Ilimitado / hotspot" },
      ] },
    { id: "streaming", titulo: "¿Quieres streaming de video incluido?",
      opciones: [
        { v: "si", t: "Sí, me interesa" },
        { v: "no", t: "No lo necesito" },
      ] },
    { id: "roaming", titulo: "¿Viajas al exterior? (roaming)",
      opciones: [
        { v: "latam", t: "Sí, a Perú/Bolivia/Ecuador" },
        { v: "eeuu", t: "Sí, a EE. UU./Canadá" },
        { v: "no", t: "No viajo" },
      ] },
    { id: "cinco_g", titulo: "¿Qué tan importante es el 5G?",
      opciones: [
        { v: "must", t: "Imprescindible" },
        { v: "nice", t: "Me gustaría" },
        { v: "meh", t: "Me da igual" },
      ] },
    { id: "internacional", titulo: "¿Haces llamadas internacionales seguido?",
      opciones: [
        { v: "si", t: "Sí" },
        { v: "no", t: "No" },
      ] },
  ];

  function flat() {
    var out = [];
    window.PLANES.operadores.forEach(function (op) {
      op.planes.forEach(function (p) { out.push({ op: op, p: p }); });
    });
    return out;
  }

  /* ---------- Motor de puntaje ---------- */
  function scorePlan(x, a) {
    var s = 0, reasons = [], dealbreak = false;
    var p = x.p, esTigo = x.op.id === "tigo", esClaro = x.op.id === "claro";
    var gb = p.ilimitado ? 999 : p.datosGB;

    // 1) Presupuesto (tope)
    var cap = { bajo: 55000, medio: 80000, alto: 1e9, libre: 1e9 }[a.presupuesto];
    if (p.precio <= cap) {
      s += 20;
      if (a.presupuesto === "bajo") reasons.push("Entra en tu presupuesto (" + fmtCOP(p.precio) + "/mes)");
    } else {
      s -= 30; dealbreak = true;
    }

    // 2) Datos
    if (a.datos === "ilimitado") {
      if (p.ilimitado) { s += 25; reasons.push("Datos ilimitados, justo lo que buscas"); }
      else s += 3;
    } else if (a.datos === "bajo") {
      if (gb <= 80) { s += 15; reasons.push("Datos suficientes sin pagar de más"); }
      else if (gb <= 110) s += 8; else s += 3;
    } else if (a.datos === "medio") {
      if (gb >= 80 && gb <= 115) { s += 15; reasons.push("Buen balance de datos para uso medio"); }
      else if (gb >= 60) s += 9; else s += 4;
    } else if (a.datos === "alto") {
      if (p.ilimitado || gb >= 120) { s += 15; reasons.push("Muchos datos para streaming diario"); }
      else if (gb >= 90) s += 10; else s += 4;
    }

    // 3) Streaming incluido
    if (a.streaming === "si") {
      if (p.streaming) { s += 12; reasons.push("Incluye " + p.streaming); }
    }

    // 4) Roaming
    if (a.roaming === "latam") {
      if (esClaro) { s += 14; reasons.push("Roaming en Perú, Bolivia y Ecuador"); } else s += 2;
    } else if (a.roaming === "eeuu") {
      if (esTigo) { s += 14; reasons.push("Enfocado en EE. UU., Canadá y Puerto Rico"); } else s += 2;
    }

    // 5) 5G
    if (a.cinco_g === "must") {
      if (p.red5g) { s += 14; reasons.push("Cuenta con red 5G"); } else s -= 20;
    } else if (a.cinco_g === "nice") {
      if (p.red5g) { s += 7; reasons.push("Incluye 5G"); }
    }

    // 6) Llamadas internacionales
    if (a.internacional === "si") {
      if (esTigo) { s += 12; reasons.push("Llamadas ilimitadas a EE. UU., Canadá y PR"); } else s += 3;
    }

    return { x: x, score: s, reasons: reasons, dealbreak: dealbreak };
  }

  function recomendar(a) {
    var ranked = flat().map(function (x) { return scorePlan(x, a); })
      .sort(function (m, n) { return n.score - m.score; });
    return ranked;
  }

  /* ---------- Render del formulario ---------- */
  function buildForm() {
    var form = document.getElementById("reco-form");
    form.innerHTML = PREGUNTAS.map(function (q, i) {
      var opts = q.opciones.map(function (o) {
        var id = q.id + "_" + o.v;
        return '<span class="opt">' +
          '<input type="radio" name="' + q.id + '" id="' + id + '" value="' + o.v + '">' +
          '<label for="' + id + '">' + esc(o.t) + "</label></span>";
      }).join("");
      return '<fieldset class="reco-q">' +
        '<legend><span class="q-num">' + (i + 1) + "</span>" + esc(q.titulo) + "</legend>" +
        '<div class="opt-group">' + opts + "</div></fieldset>";
    }).join("");

    form.addEventListener("change", update);
  }

  function currentAnswers() {
    var a = {}, done = 0;
    PREGUNTAS.forEach(function (q) {
      var sel = document.querySelector('input[name="' + q.id + '"]:checked');
      if (sel) { a[q.id] = sel.value; done++; }
    });
    return { a: a, done: done, total: PREGUNTAS.length };
  }

  function update() {
    var cur = currentAnswers();
    var box = document.getElementById("reco-result");
    if (cur.done < cur.total) {
      box.innerHTML = '<div class="reco-placeholder">' +
        '<span class="reco-placeholder-icon">📝</span>' +
        "<p>Responde las " + cur.total + " preguntas para ver tu recomendación.<br>" +
        "<strong>" + cur.done + " / " + cur.total + "</strong> respondidas.</p></div>";
      return;
    }
    renderResult(recomendar(cur.a));
  }

  function opClass(x) { return x.op.id; }

  function renderResult(ranked) {
    var box = document.getElementById("reco-result");
    var top = ranked[0], run = ranked[1];
    var p = top.x.p, op = top.x.op;

    // Normaliza puntajes para las barras (top 4)
    var maxScore = Math.max(1, top.score);
    var bars = ranked.slice(0, 4).map(function (r) {
      var pct = Math.max(4, Math.round((r.score / maxScore) * 100));
      var color = "var(--" + r.x.op.id + ")";
      return '<div class="reco-bar-row">' +
        '<div class="reco-bar-head"><span>' + esc(r.x.op.nombre + " " + r.x.p.nombre) + "</span>" +
        "<span>" + r.score + " pts</span></div>" +
        '<div class="reco-bar-track"><div class="reco-bar-fill" style="width:' + pct + "%;background:" + color + '"></div></div></div>';
    }).join("");

    var razones = top.reasons.slice(0, 5).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    if (!razones) razones = "<li>Es el plan con mejor ajuste general a tus respuestas.</li>";

    box.innerHTML =
      '<div class="reco-winner-tag">✅ Tu mejor opción</div>' +
      '<div class="reco-winner-name">' + esc(p.nombre) +
        ' <span class="reco-op-chip ' + opClass(top.x) + '">' + esc(op.nombre) + "</span></div>" +
      '<div class="reco-price">' + fmtCOP(p.precio) + ' <small>/mes</small></div>' +
      (p.oferta && p.oferta.activa ? '<div><span class="pm-oferta">🏷️ ' + esc(p.oferta.descripcion) + "</span></div>" : "") +
      '<ul class="reco-why">' + razones + "</ul>" +
      '<div class="reco-runner">Segunda opción: <strong>' + esc(run.x.op.nombre + " " + run.x.p.nombre) +
        "</strong> — " + fmtCOP(run.x.p.precio) + "/mes</div>" +
      '<div class="reco-bar-wrap">' + bars + "</div>" +
      '<p class="reco-source">Basado en datos de <a href="' + esc(p.fuente.url) + '" target="_blank" rel="noopener">' +
        esc(p.fuente.nombre) + "</a> (" + esc(p.fuente.fecha) + "). Es una sugerencia; verifica en el sitio oficial.</p>";
  }

  window.Recommender = { render: buildForm };
})();
