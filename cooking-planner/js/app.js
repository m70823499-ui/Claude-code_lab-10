/* Cooking Planner Personal — Fase 1 app.
   Vanilla-JS port of the handoff prototype (Cooking Planner.dc.html). Same
   state machine, same flows: onboarding -> generate -> interactive recipe
   (adjustable servings, per-step timers) -> log to history. Preferences and
   history persist in localStorage; recipes are generated via the app backend
   (CookingAPI -> /api/generate), so no API key is ever handled in the browser. */
(function () {
  'use strict';

  // ------------------------- config data -------------------------
  var FORMATS = [
    { value: 'pasta', label: 'Pasta', icon: 'wheat' },
    { value: 'sopas', label: 'Sopas', icon: 'utensils' },
    { value: 'mariscos', label: 'Mariscos', icon: 'shrimp' },
    { value: 'arroces', label: 'Arroces', icon: 'leaf' },
    { value: 'comfort food', label: 'Comfort food', icon: 'heart' }
  ];
  var CUISINES = [
    { value: 'italiana', label: 'Italiana', icon: 'wheat' },
    { value: 'mexicana', label: 'Mexicana', icon: 'sparkles' },
    { value: 'asiática', label: 'Asiática', icon: 'fish' },
    { value: 'mediterránea', label: 'Mediterránea', icon: 'leaf' },
    { value: 'americana', label: 'Americana', icon: 'flame' }
  ];
  var SKILLS = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  var ICON_WHITELIST = ['carrot', 'egg', 'wheat', 'milk', 'shrimp', 'drumstick', 'beef', 'onion', 'leaf', 'cookie', 'candy', 'chef-hat', 'utensils', 'fish', 'flame', 'heart', 'circle-dot'];

  var PREFS_KEY = 'cookingPlanner.prefs.v1';
  var HISTORY_KEY = 'cookingPlanner.history.v1';

  // ------------------------- helpers -------------------------
  function blankDraft() {
    return { spicy: false, fruit: false, formats: [], cuisines: [], skill: 'principiante' };
  }
  function loadJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function fmtSeconds(sec) {
    var s = Math.max(0, Math.round(sec));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
  }
  function scaledQty(amount, unit, servings, baseServings) {
    var base = baseServings > 0 ? baseServings : 1;
    var scaled = (Number(amount) || 0) * (servings / base);
    var rounded = Math.round(scaled * 4) / 4;
    var trimmed = (Math.round(rounded * 100) / 100).toString();
    return unit ? (trimmed + ' ' + unit) : trimmed;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ------------------------- component builders (HTML strings) -------------------------
  function icon(name, size, color, style) {
    var inner = window.CP_ICONS[name] || window.CP_ICONS['circle-dot'];
    return '<svg role="img" aria-label="' + esc(name) + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:block;' +
      (style || '') + '">' + inner + '</svg>';
  }
  var BTN_ICON = { sm: 15, md: 17, lg: 19 };
  function button(opts) {
    var size = opts.size || 'md';
    var variant = opts.variant || 'primary';
    var cls = 'cp-btn cp-btn--' + size + ' cp-btn--' + variant + (opts.cls ? ' ' + opts.cls : '');
    var attrs = 'class="' + cls + '"';
    if (opts.action) attrs += ' data-action="' + opts.action + '"';
    if (opts.data) { for (var k in opts.data) attrs += ' data-' + k + '="' + esc(opts.data[k]) + '"'; }
    if (opts.disabled) attrs += ' disabled';
    if (opts.style) attrs += ' style="' + opts.style + '"';
    var ic = opts.icon ? icon(opts.icon, BTN_ICON[size], 'currentColor') : '';
    return '<button ' + attrs + '>' + ic + '<span>' + esc(opts.label) + '</span></button>';
  }
  function iconButton(opts) {
    var size = opts.size || 38;
    var active = !!opts.active;
    var cls = 'cp-iconbtn' + (active ? ' cp-iconbtn--active' : '');
    var attrs = 'class="' + cls + '" aria-label="' + esc(opts.label || opts.name) + '"';
    attrs += ' style="width:' + size + 'px;height:' + size + 'px;' + (opts.hidden ? 'visibility:hidden;' : '') + (opts.style || '') + '"';
    if (opts.action) attrs += ' data-action="' + opts.action + '"';
    if (opts.data) { for (var k in opts.data) attrs += ' data-' + k + '="' + esc(opts.data[k]) + '"'; }
    var col = active ? 'var(--accent-primary)' : 'var(--text-secondary)';
    return '<button ' + attrs + '>' + icon(opts.name, Math.round(size * 0.46), col) + '</button>';
  }
  function badge(opts) {
    var tone = opts.tone || 'neutral';
    var col = ({ neutral: 'var(--text-secondary)', accent: 'var(--accent-primary-hover)', success: 'var(--success)', dark: 'var(--text-on-dark)' })[tone];
    var ic = opts.icon ? icon(opts.icon, 13, col) : '';
    return '<span class="cp-badge cp-badge--' + tone + '">' + ic + esc(opts.label) + '</span>';
  }
  function tag(opts) {
    var cls = 'cp-tag' + (opts.selected ? ' cp-tag--selected' : '');
    var attrs = 'class="' + cls + '"';
    if (opts.action) attrs += ' data-action="' + opts.action + '"';
    if (opts.data) { for (var k in opts.data) attrs += ' data-' + k + '="' + esc(opts.data[k]) + '"'; }
    var ic = opts.icon ? icon(opts.icon, 14, 'currentColor') : '';
    return '<span ' + attrs + '>' + ic + esc(opts.label) + '</span>';
  }

  // ------------------------- state -------------------------
  var state = {
    view: 'onboarding',        // onboarding | editPrefs | home | recipe | history
    prefs: null,
    draft: blankDraft(),
    onboardingError: false,
    history: [],
    recipe: null,
    baseServings: 2,
    servings: 2,
    status: 'idle',            // idle | loading | ready | error
    checked: {},
    timers: {},
    logOpen: false,
    ratingDraft: 0
  };

  function setState(partial) { Object.assign(state, partial); render(); }
  function persistPrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {} }
  function persistHistory(h) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch (e) {} }

  // ------------------------- draft field toggles -------------------------
  function toggleFormat(v) {
    var has = state.draft.formats.indexOf(v) !== -1;
    state.draft.formats = has ? state.draft.formats.filter(function (x) { return x !== v; }) : state.draft.formats.concat([v]);
    setState({ onboardingError: false });
  }
  function toggleCuisine(v) {
    var has = state.draft.cuisines.indexOf(v) !== -1;
    state.draft.cuisines = has ? state.draft.cuisines.filter(function (x) { return x !== v; }) : state.draft.cuisines.concat([v]);
    setState({ onboardingError: false });
  }
  function setSkill(v) { state.draft.skill = v; setState({}); }
  function setSpicy(v) { state.draft.spicy = v; setState({}); }
  function setFruit(v) { state.draft.fruit = v; setState({}); }
  function validDraft(d) { return d.formats.length > 0 && d.cuisines.length > 0; }

  function saveForm() {
    if (!validDraft(state.draft)) { setState({ onboardingError: true }); return; }
    var prefs = JSON.parse(JSON.stringify(state.draft));
    persistPrefs(prefs);
    setState({ prefs: prefs, view: 'home', onboardingError: false });
  }
  function openEditPrefs() { setState({ draft: JSON.parse(JSON.stringify(state.prefs)), view: 'editPrefs', onboardingError: false }); }
  function cancelEditPrefs() { setState({ draft: JSON.parse(JSON.stringify(state.prefs)), view: 'home', onboardingError: false }); }
  function goHome() { setState({ view: 'home' }); }
  function goHistory() { setState({ view: 'history' }); }

  // ------------------------- recipe generation -------------------------
  function startGenerate() {
    setState({ view: 'recipe', status: 'loading', recipe: null, checked: {}, timers: {}, servings: state.baseServings || 2 });
    generateRecipe(false);
  }
  function regenerate() { setState({ status: 'loading', recipe: null, checked: {}, timers: {} }); generateRecipe(false); }
  function manualRetry() { setState({ status: 'loading' }); generateRecipe(false); }

  function buildPrompt() {
    var p = state.prefs || blankDraft();
    return [
      'Genera UNA receta casera en español neutro, en formato JSON estricto (sin markdown, sin comentarios, sin texto fuera del JSON).',
      'Preferencias fijas del usuario (respétalas siempre):',
      '- Picante: ' + (p.spicy ? 'sí, puede llevar picante' : 'NO, nada de picante') + '.',
      '- Fruta en la receta: ' + (p.fruit ? 'permitida' : 'NO incluir fruta como ingrediente') + '.',
      '- Formatos favoritos: ' + p.formats.join(', ') + '.',
      '- Cocinas favoritas: ' + p.cuisines.join(', ') + '.',
      '- Nivel de habilidad: ' + p.skill + ' (pasos claros, trucos prácticos, sin jerga de chef si es principiante).',
      'Elige un formato y una cocina de esas listas para esta receta puntual.',
      'Devuelve exactamente este JSON (tipos exactos, sin campos extra):',
      '{"title": string, "difficulty": "Fácil"|"Intermedio"|"Avanzado", "calories": number, "timeMinutes": number, "baseServings": number, "tags": [string, string], ' +
      '"ingredients": [{"icon": string (uno de: ' + ICON_WHITELIST.join(',') + '), "label": string, "amount": number, "unit": string}], ' +
      '"steps": [{"title": string, "description": string, "waitSeconds": number (0 si el paso no implica espera ni cocción; si implica, poné los segundos reales de esa espera/cocción)}]}',
      'De 5 a 9 ingredientes y de 4 a 8 pasos. baseServings entre 2 y 4. Usa español neutro (sin voseo, sin modismos regionales).'
    ].join('\n');
  }
  function parseRecipe(text) {
    var clean = (text || '').trim();
    var fence = clean.match(/\{[\s\S]*\}/);
    if (fence) clean = fence[0];
    var data = JSON.parse(clean);
    if (!data.title || !Array.isArray(data.ingredients) || !Array.isArray(data.steps)) throw new Error('shape');
    return data;
  }
  async function generateRecipe(isRetry) {
    try {
      var text = await window.CookingAPI.complete(buildPrompt());
      var data = parseRecipe(text);
      var baseServings = Math.max(1, Math.round(data.baseServings) || 2);
      setState({ recipe: data, baseServings: baseServings, servings: baseServings, status: 'ready', checked: {}, timers: {} });
    } catch (e) {
      if (!isRetry) { generateRecipe(true); return; }
      setState({ status: 'error', errorMsg: (e && e.message) || '' });
    }
  }

  function decServings() { setState({ servings: Math.max(1, state.servings - 1) }); }
  function incServings() { setState({ servings: state.servings + 1 }); }
  function toggleIngredient(i) { state.checked[i] = !state.checked[i]; setState({}); }
  function toggleTimer(i, seconds) {
    var cur = state.timers[i];
    if (!cur) { state.timers[i] = { remaining: seconds, running: true }; }
    else if (cur.remaining <= 0) { state.timers[i] = { remaining: seconds, running: true }; }
    else { state.timers[i] = { remaining: cur.remaining, running: !cur.running }; }
    setState({});
  }

  // ------------------------- log to history -------------------------
  function openLog() { setState({ logOpen: true, ratingDraft: 0 }); }
  function closeLog() { setState({ logOpen: false }); }
  function setRating(n) { setState({ ratingDraft: n }); }
  function saveLog() {
    var noteEl = document.querySelector('[data-note]');
    var note = noteEl ? noteEl.value : '';
    if (state.ratingDraft < 1 || !state.recipe) return;
    var norm = state.recipe.title.trim().toLowerCase();
    var isRepeat = state.history.some(function (h) { return h.title.trim().toLowerCase() === norm; });
    var entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: state.recipe.title,
      rating: state.ratingDraft,
      note: (note || '').trim(),
      isRepeat: isRepeat
    };
    var nextHistory = [entry].concat(state.history);
    persistHistory(nextHistory);
    setState({ history: nextHistory, logOpen: false, view: 'home' });
  }

  // ------------------------- timers tick -------------------------
  function tick() {
    var changed = false;
    Object.keys(state.timers).forEach(function (k) {
      var t = state.timers[k];
      if (t.running && t.remaining > 0) {
        t.remaining -= 1;
        if (t.remaining <= 0) t.running = false;
        changed = true;
      }
    });
    // Re-render only when a timer changed and the log modal (with its textarea)
    // isn't open, to avoid stealing focus from the note field.
    if (changed && !state.logOpen) render();
  }

  // ------------------------- action dispatch -------------------------
  var ACTIONS = {
    'go-home': goHome,
    'go-history': goHistory,
    'open-prefs': openEditPrefs,
    'save-form': saveForm,
    'cancel-prefs': cancelEditPrefs,
    'set-spicy': function (el) { setSpicy(el.getAttribute('data-val') === 'true'); },
    'set-fruit': function (el) { setFruit(el.getAttribute('data-val') === 'true'); },
    'toggle-format': function (el) { toggleFormat(el.getAttribute('data-val')); },
    'toggle-cuisine': function (el) { toggleCuisine(el.getAttribute('data-val')); },
    'set-skill': function (el) { setSkill(el.getAttribute('data-val')); },
    'start-generate': startGenerate,
    'regenerate': regenerate,
    'manual-retry': manualRetry,
    'dec-servings': decServings,
    'inc-servings': incServings,
    'toggle-ing': function (el) { toggleIngredient(Number(el.getAttribute('data-idx'))); },
    'toggle-timer': function (el) { toggleTimer(Number(el.getAttribute('data-idx')), Number(el.getAttribute('data-secs')) || 0); },
    'open-log': openLog,
    'close-log': closeLog,
    'set-rating': function (el) { setRating(Number(el.getAttribute('data-val'))); },
    'save-log': saveLog
  };

  function onClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var fn = ACTIONS[el.getAttribute('data-action')];
    if (fn) { e.preventDefault(); fn(el); }
  }

  // ------------------------- views -------------------------
  function topBar(view) {
    var isHome = view === 'home', isRecipe = view === 'recipe', isHistory = view === 'history', isEditPrefs = view === 'editPrefs';
    if (!(isHome || isRecipe || isHistory || isEditPrefs)) return '';
    return '<div class="cp-topbar">' +
      iconButton({ name: 'arrow-left', label: 'Volver', action: 'go-home', hidden: isHome }) +
      '<div class="cp-brand">' + icon('chef-hat', 20, 'var(--accent-primary)') +
      '<span class="cp-brand__name">Cooking Planner</span></div>' +
      iconButton({ name: 'list', label: 'Historial', active: isHistory, action: 'go-history' }) +
      iconButton({ name: 'settings', label: 'Preferencias', active: isEditPrefs, action: 'open-prefs' }) +
      '</div>';
  }

  function formView(isEditPrefs) {
    var d = state.draft;
    var eyebrow = isEditPrefs ? 'Editar preferencias' : 'Antes de empezar';
    var title = isEditPrefs ? 'Tus preferencias' : 'Cuéntanos qué te gusta cocinar';
    var subtitle = isEditPrefs
      ? 'Cambia lo que necesites; se aplica a la próxima receta que generes.'
      : 'Esto define cada receta que se genere para ti. Puedes editarlo después.';
    var topPad = isEditPrefs ? '4px' : '48px';
    var saveLabel = isEditPrefs ? 'Guardar cambios' : 'Guardar preferencias';

    var spicyRow =
      '<div><div class="cp-field-label">¿Comida picante?</div><div style="display:flex;gap:8px;">' +
      tag({ label: 'Sí', icon: 'flame', selected: d.spicy === true, action: 'set-spicy', data: { val: 'true' } }) +
      tag({ label: 'No', icon: 'x', selected: d.spicy === false, action: 'set-spicy', data: { val: 'false' } }) +
      '</div></div>';
    var fruitRow =
      '<div><div class="cp-field-label">¿Fruta en las recetas?</div><div style="display:flex;gap:8px;">' +
      tag({ label: 'Sí', icon: 'citrus', selected: d.fruit === true, action: 'set-fruit', data: { val: 'true' } }) +
      tag({ label: 'No', icon: 'x', selected: d.fruit === false, action: 'set-fruit', data: { val: 'false' } }) +
      '</div></div>';
    var formatsRow =
      '<div><div class="cp-field-label">Formatos favoritos</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      FORMATS.map(function (f) {
        return tag({ label: f.label, icon: f.icon, selected: d.formats.indexOf(f.value) !== -1, action: 'toggle-format', data: { val: f.value } });
      }).join('') + '</div></div>';
    var cuisinesRow =
      '<div><div class="cp-field-label">Cocinas favoritas</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      CUISINES.map(function (c) {
        return tag({ label: c.label, icon: c.icon, selected: d.cuisines.indexOf(c.value) !== -1, action: 'toggle-cuisine', data: { val: c.value } });
      }).join('') + '</div></div>';
    var skillRow =
      '<div><div class="cp-field-label">Nivel de habilidad</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      SKILLS.map(function (s) {
        return tag({ label: s.label, icon: 'chef-hat', selected: d.skill === s.value, action: 'set-skill', data: { val: s.value } });
      }).join('') + '</div></div>';

    var errorRow = state.onboardingError
      ? '<div style="display:flex;align-items:center;gap:8px;color:var(--accent-secondary-hover);font-size:var(--text-sm);font-weight:600;background:var(--olive-100);border-radius:var(--radius-md);padding:10px 14px;">' +
        icon('alert-triangle', 16, 'var(--accent-secondary-hover)') +
        'Elige al menos un formato y una cocina para continuar.</div>'
      : '';

    var actions = '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
      (isEditPrefs ? button({ label: 'Cancelar', variant: 'secondary', action: 'cancel-prefs' }) : '') +
      button({ label: saveLabel, variant: 'primary', size: 'lg', icon: 'check', action: 'save-form' }) +
      '</div>';

    return '<div class="cp-fade" style="max-width:640px;margin:0 auto;padding:' + topPad + ' 28px 80px;">' +
      '<div style="margin-bottom:28px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      icon('sparkles', 18, 'var(--accent-primary)') + '<span class="cp-eyebrow">' + eyebrow + '</span></div>' +
      '<h1 style="font-size:var(--text-3xl);margin:0 0 8px;">' + esc(title) + '</h1>' +
      '<p style="font-family:var(--font-body);font-size:var(--text-base);color:var(--text-secondary);margin:0;line-height:var(--leading-normal);">' + esc(subtitle) + '</p>' +
      '</div>' +
      '<div class="cp-card">' + spicyRow + fruitRow + formatsRow + cuisinesRow + skillRow + errorRow + actions + '</div>' +
      '</div>';
  }

  function homeView() {
    var count = state.history.length;
    var label = count === 0 ? 'Sin recetas registradas todavía' : (count + (count === 1 ? ' receta cocinada' : ' recetas cocinadas'));
    return '<div class="cp-fade" style="max-width:640px;margin:0 auto;padding:24px 28px 40px;text-align:center;">' +
      '<div style="margin:40px 0 30px;">' +
      icon('chef-hat', 46, 'var(--accent-primary)') +
      '<h1 style="font-size:var(--text-3xl);margin:16px 0 10px;">¿Qué cocinamos hoy?</h1>' +
      '<p style="font-family:var(--font-body);font-size:var(--text-base);color:var(--text-secondary);max-width:420px;margin:0 auto;line-height:var(--leading-normal);">Genera una receta nueva ajustada a tus gustos, sin límites de un plan pago.</p>' +
      '</div>' +
      button({ label: 'Generar receta', variant: 'primary', size: 'lg', icon: 'sparkles', action: 'start-generate', style: 'width:100%;max-width:360px;margin:0 auto;' }) +
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:32px;flex-wrap:wrap;">' +
      '<div class="cp-pill">' + icon('list', 15, 'var(--accent-secondary)') + '<span>' + esc(label) + '</span></div></div>' +
      '</div>';
  }

  function recipeView() {
    var inner = '';
    if (state.status === 'loading') {
      inner = '<div style="display:flex;flex-direction:column;align-items:center;gap:18px;padding:100px 20px;">' +
        '<div class="cp-spinner"></div>' +
        '<span style="font-family:var(--font-body);font-weight:600;color:var(--text-secondary);">Generando tu receta…</span></div>';
    } else if (state.status === 'error') {
      var detail = state.errorMsg && state.errorMsg !== 'network'
        ? esc(state.errorMsg)
        : 'Revisa tu conexión e intenta de nuevo.';
      inner = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:90px 20px;text-align:center;">' +
        icon('alert-triangle', 34, 'var(--accent-secondary-hover)') +
        '<div><div style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:6px;">No se pudo generar la receta</div>' +
        '<div style="font-family:var(--font-body);color:var(--text-muted);font-size:var(--text-sm);max-width:360px;">' + detail + '</div></div>' +
        button({ label: 'Reintentar', variant: 'primary', icon: 'refresh-cw', action: 'manual-retry' }) + '</div>';
    } else if (state.status === 'ready' && state.recipe) {
      inner = recipeReady();
    }
    return '<div class="cp-fade" style="max-width:720px;margin:0 auto;padding:8px 28px 120px;">' + inner + '</div>';
  }

  function recipeReady() {
    var r = state.recipe;
    var tagsHtml = (r.tags || []).map(function (t) { return badge({ label: t, tone: 'neutral' }); }).join('');
    var badges = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' +
      badge({ label: r.difficulty || '', tone: 'accent', icon: 'chef-hat' }) + tagsHtml + '</div>';

    var stats = [
      { icon: 'flame', value: r.calories, label: 'Calorías' },
      { icon: 'clock', value: r.timeMinutes + ' min', label: 'Prep + cocción' },
      { icon: 'users', value: state.servings, label: 'Porciones' }
    ];
    var statsBar = '<div class="cp-statsbar" style="margin-bottom:28px;">' + stats.map(function (s) {
      return '<div class="cp-stat">' + icon(s.icon, 16, 'var(--slate-700)') +
        '<div class="cp-stat__col"><span class="cp-stat__v">' + esc(s.value) + '</span>' +
        '<span class="cp-stat__l">' + esc(s.label) + '</span></div></div>';
    }).join('') + '</div>';

    var servingsLabel = state.servings + (state.servings === 1 ? ' porción' : ' porciones');
    var ingHeader = '<div style="display:flex;align-items:center;justify-content:space-between;margin:28px 0 10px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' + icon('utensils', 17, 'var(--accent-primary)') +
      '<h3 style="font-size:var(--text-xl);margin:0;">Ingredientes</h3></div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      iconButton({ name: 'minus', size: 32, label: 'Menos porciones', action: 'dec-servings' }) +
      '<span style="font-family:var(--font-display);font-weight:700;font-size:var(--text-md);min-width:70px;text-align:center;">' + esc(servingsLabel) + '</span>' +
      iconButton({ name: 'plus', size: 32, label: 'Más porciones', action: 'inc-servings' }) +
      '</div></div>';

    var ingRows = r.ingredients.map(function (ing, i) {
      var ic = ICON_WHITELIST.indexOf(ing.icon) !== -1 ? ing.icon : 'circle-dot';
      var qty = scaledQty(ing.amount, ing.unit, state.servings, state.baseServings);
      var checked = !!state.checked[i];
      var check = '<div class="cp-ing__check">' + (checked ? icon('check', 13, 'var(--white)') : '') + '</div>';
      return '<div class="cp-ing' + (checked ? ' cp-ing--checked' : '') + '" data-action="toggle-ing" data-idx="' + i + '">' +
        check + icon(ic, 18, 'var(--slate-500)') +
        '<span class="cp-ing__label">' + esc(ing.label) + '</span>' +
        '<span class="cp-ing__qty">' + esc(qty) + '</span></div>';
    }).join('');
    var ingredients = ingHeader +
      '<div style="margin-bottom:32px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:4px 14px;">' +
      ingRows + '</div>';

    var stepsHeader = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
      icon('list', 17, 'var(--accent-primary)') + '<h3 style="font-size:var(--text-xl);margin:0;">Instrucciones</h3></div>';
    var lastIdx = r.steps.length - 1;
    var stepsHtml = r.steps.map(function (st, i) {
      var isLast = i === lastIdx;
      var hasTimer = Number(st.waitSeconds) > 0;
      var timer = state.timers[i];
      var remaining = timer ? timer.remaining : Number(st.waitSeconds) || 0;
      var running = timer ? timer.running : false;
      var done = hasTimer && timer && timer.remaining <= 0;
      var timerBlock = '';
      if (hasTimer) {
        var tcolor = done ? 'var(--success)' : 'var(--accent-primary)';
        var btnVariant = running ? 'secondary' : 'primary';
        var btnLabel = done ? 'Listo' : (running ? 'Pausar' : (timer ? 'Reanudar' : 'Iniciar'));
        timerBlock = '<div class="cp-timer">' + icon('timer', 16, tcolor) +
          '<span class="cp-timer__val" style="color:' + tcolor + ';">' + fmtSeconds(remaining) + '</span>' +
          button({ label: btnLabel, variant: btnVariant, size: 'sm', action: 'toggle-timer', data: { idx: i, secs: Number(st.waitSeconds) || 0 } }) +
          '</div>';
      }
      return '<div class="cp-step">' +
        '<div class="cp-step__rail"><div class="cp-step__num">' + (i + 1) + '</div>' +
        (isLast ? '' : '<div class="cp-step__line"></div>') + '</div>' +
        '<div style="padding-bottom:' + (isLast ? '0' : '28px') + ';flex:1;">' +
        '<h4 class="cp-step__title">' + esc(st.title) + '</h4>' +
        '<p class="cp-step__desc">' + esc(st.description) + '</p>' + timerBlock + '</div></div>';
    }).join('');
    var steps = stepsHeader + '<div style="margin-bottom:32px;">' + stepsHtml + '</div>';

    var actionBar = '<div class="cp-actionbar">' +
      button({ label: 'No me convence, otra', variant: 'secondary', icon: 'refresh-cw', action: 'regenerate', style: 'flex:1;max-width:320px;' }) +
      button({ label: 'Ya la cociné', variant: 'primary', icon: 'check', action: 'open-log', style: 'flex:1;max-width:320px;' }) +
      '</div>';

    return badges + '<h1 style="font-size:var(--text-3xl);margin:0 0 18px;">' + esc(r.title) + '</h1>' +
      statsBar + ingredients + steps + actionBar;
  }

  function historyView() {
    var count = state.history.length;
    var countLabel = count === 0 ? 'Sin recetas registradas todavía' : (count + (count === 1 ? ' receta cocinada' : ' recetas cocinadas'));
    var body;
    if (count === 0) {
      body = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:70px 20px;color:var(--text-muted);text-align:center;">' +
        icon('list', 28, 'var(--text-muted)') +
        'Todavía no has cocinado nada registrado. Genera una receta y confírmalo cuando la cocines.</div>';
    } else {
      body = state.history.map(function (h) {
        var starsHtml = [1, 2, 3, 4, 5].map(function (n) {
          var on = n <= h.rating;
          return icon('star', 14, on ? 'var(--accent-primary)' : 'var(--border-strong)', on ? 'fill:var(--accent-primary);' : '');
        }).join('');
        var note = h.note ? '<p style="margin:6px 0 0;font-family:var(--font-body);font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-normal);">' + esc(h.note) + '</p>' : '';
        return '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">' +
          '<span style="font-family:var(--font-display);font-size:var(--text-md);font-weight:700;">' + esc(h.title) + '</span>' +
          badge({ label: h.isRepeat ? 'Repetida' : 'Nueva', tone: h.isRepeat ? 'neutral' : 'accent' }) + '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
          '<div style="display:flex;gap:2px;">' + starsHtml + '</div>' +
          '<span style="font-family:var(--font-body);font-size:var(--text-xs);color:var(--text-muted);">' + esc(h.date) + '</span></div>' +
          note + '</div>';
      }).join('');
    }
    return '<div class="cp-fade" style="max-width:640px;margin:0 auto;padding:24px 28px 40px;">' +
      '<h1 style="font-size:var(--text-3xl);margin:0 0 6px;">Historial</h1>' +
      '<p style="font-family:var(--font-body);color:var(--text-secondary);margin:0 0 24px;">' + esc(countLabel) + '</p>' +
      body + '</div>';
  }

  function logModal() {
    if (!state.logOpen) return '';
    var stars = [1, 2, 3, 4, 5].map(function (n) {
      return iconButton({ name: 'star', size: 42, active: n <= state.ratingDraft, action: 'set-rating', data: { val: n } });
    }).join('');
    return '<div class="cp-overlay"><div class="cp-modal">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
      '<h3 style="font-size:var(--text-xl);margin:0;">¿Cómo salió?</h3>' +
      iconButton({ name: 'x', size: 32, label: 'Cerrar', action: 'close-log' }) + '</div>' +
      '<p style="font-family:var(--font-body);color:var(--text-secondary);margin:0 0 18px;font-size:var(--text-sm);">' + esc(state.recipe ? state.recipe.title : '') + '</p>' +
      '<div style="display:flex;gap:8px;margin-bottom:18px;">' + stars + '</div>' +
      '<div style="margin-bottom:20px;">' +
      '<label style="font-family:var(--font-body);font-weight:700;font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:8px;">Observación (opcional)</label>' +
      '<textarea class="cp-textarea" data-note placeholder="¿Qué cambiarías? ¿Cómo te quedó?"></textarea></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
      button({ label: 'Cancelar', variant: 'secondary', action: 'close-log' }) +
      button({ label: 'Guardar en historial', variant: 'primary', icon: 'check', action: 'save-log', disabled: state.ratingDraft < 1 }) +
      '</div></div></div>';
  }

  // ------------------------- render -------------------------
  function render() {
    var view = state.view;
    var main = '';
    if (view === 'onboarding') main = formView(false);
    else if (view === 'editPrefs') main = formView(true);
    else if (view === 'home') main = homeView();
    else if (view === 'recipe') main = recipeView();
    else if (view === 'history') main = historyView();

    document.getElementById('app').innerHTML = topBar(view) + main + logModal();
  }

  // ------------------------- boot -------------------------
  function init() {
    var prefs = loadJSON(PREFS_KEY, null);
    var history = loadJSON(HISTORY_KEY, []);
    state.prefs = prefs;
    state.history = Array.isArray(history) ? history : [];
    state.view = prefs ? 'home' : 'onboarding';
    state.draft = prefs ? JSON.parse(JSON.stringify(prefs)) : blankDraft();
    document.getElementById('app').addEventListener('click', onClick);
    setInterval(tick, 1000);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
