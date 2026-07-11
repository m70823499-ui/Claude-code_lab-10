# CLAUDE.md

Guía del proyecto para asistentes (Claude Code) y para quien retome el trabajo.
Resume la estructura, las decisiones de diseño, las preferencias del usuario y
las secciones que existen. **Mantener este archivo actualizado** cuando cambie
algo relevante.

---

## 🎯 Qué es este proyecto

Página web para **monitorear y comparar los planes móviles pospago** de los
competidores **Tigo** y **Claro** en Colombia. Cumple dos propósitos:

1. **Dashboard competitivo** — precios, datos y ofertas de un vistazo, con gráficos.
2. **Recomendador** — un cuestionario que sugiere el plan ideal según las
   necesidades del usuario.

Es un **sitio estático, sin build ni dependencias externas**. Se abre haciendo
doble clic en `index.html` (no requiere servidor).

---

## 📁 Estructura de carpetas y qué hace cada archivo

```
Claude-code_lab-10/
├── index.html          Página única: contiene todas las secciones (HTML + contenedores vacíos)
├── css/
│   └── styles.css      Todos los estilos, tema claro/oscuro y responsive
├── js/
│   ├── data.js         ← FUENTE DE DATOS. window.PLANES con planes reales + fuentes + fecha
│   ├── charts.js       Gráficos en SVG puro.  API: window.Charts.render(dark)
│   ├── comparison.js   Matriz comparativa + KPIs + consideraciones. API: window.Comparison.render()
│   ├── recommender.js  Cuestionario + motor de puntaje. API: window.Recommender.render()
│   ├── auth.js         Registro/login LOCAL (localStorage). API: window.Auth (signup/login/logout/current/onChange)
│   ├── comunidad.js    Sección "Comunidad": comentarios/experiencias. API: window.Comunidad.render()
│   └── app.js          Orquestador: tema, fecha, leyenda, arranca todo en DOMContentLoaded
├── README.md           Instrucciones de uso, publicación y actualización de datos
├── CLAUDE.md           Este archivo
└── .gitignore          Ignora node_modules/ y preview-*.png (artefactos de verificación)
```

**Orden de carga de scripts** (en `index.html`, al final del `<body>`):
`data.js` → `charts.js` → `comparison.js` → `recommender.js` → `auth.js` →
`comunidad.js` → `app.js`. `app.js` es el último porque llama a los `render()`
de los demás módulos. `comunidad.js` va después de `auth.js` porque lo usa.

Cada módulo JS es un IIFE que expone un único objeto global (`window.Charts`,
`window.Comparison`, `window.Recommender`, `window.Auth`, `window.Comunidad`).
No hay bundler ni imports ES.

---

## 🧱 Modelo de datos (`js/data.js`)

Todo lo editable vive en `window.PLANES`:

```js
window.PLANES = {
  actualizado: "2026-07-11",     // fecha global; se muestra en encabezado y pie
  moneda: "COP",
  disclaimer: "...",             // aviso legal mostrado bajo los KPIs
  operadores: [
    { id, nombre, color, colorDark, planes: [ {
        id, nombre, precio, precioNormal, datosGB, ilimitado, datosCompartir,
        minutos, sms, red, red5g, streaming, roaming, extras[],
        oferta: { activa, descripcion, vigencia },
        fuente: { nombre, url, fecha }     // ← obligatorio: de dónde salió el dato
    } ] }
  ],
  consideraciones: [ { icono, titulo, texto } ]   // "cosas a tener en cuenta"
}
```

- Planes **ilimitados**: `ilimitado: true`, `datosGB: null`, y `datosCompartir`
  con el tope de hotspot (para poder graficarlos).
- **Regla de oro:** cada plan lleva su `fuente` con `fecha`. No se agrega ningún
  dato sin fuente verificable.

---

## 🎨 Decisiones de diseño

### Estilo visual
- Inspirado en una **tabla de pricing** que compartió el usuario: banda de
  encabezado en **teal oscuro**, **insignias circulares de precio**, filas
  alternadas en gris, celdas con **✓/✕ circulares**, y **pastillas de color**
  por columna.

### Colores (validados con el skill `dataviz`)
- **Identidad de operadores** (categórica, sigue a la entidad, no al orden):
  - Tigo → `#0057B8` (claro) / `#4C97F0` (oscuro) — azul
  - Claro → `#E1251B` (claro) / `#EF5350` (oscuro) — rojo
  - Validados con `scripts/validate_palette.js`: separación CVD >70 ΔE (muy por
    encima del objetivo de 12). Si se agregan más operadores, **volver a validar**.
- **Superficies:** encabezado teal `#14343a` (claro) / `#0c1f23` (oscuro).
- **Acentos funcionales:** teal `#17b3a3` (botones/opciones activas/✓), ámbar
  `#e8a13a` (ofertas), verde `#2fa36b` (✓), gris apagado para ✕.
- Todo se maneja con **variables CSS** en `:root` y `:root[data-theme="dark"]`,
  más un bloque `@media (prefers-color-scheme: dark)` para respetar el sistema.

### Layout
- **Página única** con navegación por anclas (encabezado sticky).
- Grillas responsive: gráficos 2 columnas → 1 en móvil; recomendador 2 columnas
  → 1 en móvil; la matriz de pricing usa `min-width` + scroll horizontal en móvil.
- Gráficos en **SVG puro** (sin librerías), con `viewBox` para escalar. Se
  **re-renderizan al cambiar de tema** (los colores de barra dependen del tema).
- Tooltips nativos con `<title>` en las marcas SVG (sin JS de tooltip).

### Arquitectura de datos
- Datos en un **archivo `.js`** (`window.PLANES`), **no** JSON cargado por
  `fetch`. Motivo: así `index.html` funciona con **doble clic** (`file://`) sin
  chocar con CORS ni necesitar servidor.
- **Sin scraping en vivo:** los sitios oficiales de Tigo/Claro bloquean bots
  (HTTP 403). Los datos se curan manualmente desde agregadores (Selectra
  Colombia, celulares.com) vía búsqueda web.

---

## 🗺️ Secciones de la página (en `index.html`)

1. **Encabezado (sticky)** — título, toggle de tema (🌙/☀️), "última
   actualización", y subnavegación con anclas.
2. **Intro + KPIs** — texto de contexto, 4 tarjetas KPI (planes comparados,
   precio más bajo, mejor valor $/GB, ofertas activas) y el disclaimer.
3. **`#dashboard` — "Los números, de un vistazo"** — 4 gráficos:
   - Precio mensual por plan (barras)
   - Datos incluidos en GB (barras; ilimitado marcado con ∞)
   - Precio por GB (barras; solo planes con GB definidos)
   - Precio vs. datos (dispersión) — más leyenda de operadores.
4. **`#cobertura` — "Cobertura 5G por operador"** — tarjeta con un gráfico SVG
   de celdas ✓/✕ (una por plan) que muestra cuántos planes de cada operador
   traen 5G y desde qué precio arranca. Usa el campo `red5g` que ya existe en
   `data.js` (no requiere datos nuevos). Se re-renderiza al cambiar de tema.
5. **`#comparador` — matriz estilo pricing** — cabecera con insignia circular de
   precio por plan; filas: Datos, Red, 5G, Minutos, SMS, Streaming, Roaming,
   Oferta, Fuente; pie con pastilla del operador.
6. **`#consideraciones` — "Cosas a tener en cuenta"** — tarjetas con ícono
   (permanencia, letra pequeña de ofertas, velocidad tras agotar datos, 5G,
   roaming, streaming incluido, datos para compartir).
7. **`#recomendador` — "¿Cuál me conviene?"** — cuestionario de 6 preguntas +
   panel de resultado (plan top, precio, razones, segunda opción, barras de
   puntaje, fuente).
8. **`#comunidad` — "Comunidad"** — registro/login (usuario + contraseña) y muro
   de experiencias. Sin sesión muestra pestañas Entrar/Crear cuenta; con sesión,
   un compositor (texto + operador Tigo/Claro/General + valoración de estrellas)
   y la lista de comentarios filtrable por operador. Ver módulo abajo.

---

## 🧮 Motor del recomendador (`js/recommender.js`)

- 6 preguntas: **presupuesto, consumo de datos, streaming incluido, roaming, 5G,
  llamadas internacionales**.
- Puntaje **transparente**: `scorePlan()` suma/resta puntos por criterio y
  acumula **razones** legibles. Se ordenan los planes y se muestra el 1º (con
  porqué) y el 2º, más barras normalizadas del top 4.
- Presupuesto fuera de rango penaliza fuerte (el plan queda descartado en la
  práctica). El 5G "imprescindible" penaliza planes sin 5G.
- Al cambiar respuestas se recalcula en vivo; requiere las 6 respondidas para
  mostrar recomendación.

---

## 👥 Comunidad y autenticación (`js/auth.js` + `js/comunidad.js`)

- **Solo local, sin servidor:** usuarios y comentarios viven en `localStorage`
  (claves `comunidad-usuarios`, `comunidad-sesion`, `comunidad-comentarios`).
  **No se comparten entre navegadores ni personas.** El usuario sabe que hoy es
  un prototipo local; el siguiente paso natural es reemplazar el almacenamiento
  por un servidor/API sin tocar la UI.
- **`window.Auth`** aísla el almacenamiento (`read`/`write`) para facilitar ese
  salto. La contraseña se guarda como un **hash de ofuscación (djb2 + sal), NO
  criptográfico** → **no es seguridad real**, advertirlo siempre en la UI.
- **`window.Comunidad`** se re-dibuja al cambiar la sesión (`Auth.onChange`).
  Mantiene estado de UI en variables del módulo (`authTab`, `filtro`). Cada
  comentario: `{ id, usuario, texto, operador, estrellas, fecha }`.
- Al ampliar (preguntas/respuestas, foros por hilos) apoyarse en estos módulos.

## 🙋 Preferencias del usuario (respetar en cambios futuros)

- **Idioma: español** en toda la interfaz y el contenido.
- **No inventar información:** cada dato con su fuente y fecha visibles. Ante
  duda, no agregar el dato.
- **Nada de solo texto:** los gráficos/diagramas claros son el centro, no un
  extra.
- **Caso mantenimiento:** si una fuente está caída al actualizar, **conservar
  los valores anteriores** y **no cambiar** su `fecha` (el historial queda en git).
- **Alcance:** solo planes **pospago**, solo **Tigo y Claro**.
- **Simplicidad de uso:** el usuario no es técnico. Debe poder **abrir
  `index.html` con doble clic**; al explicar cosas (ramas, PR, cómo abrir
  archivos), hacerlo **paso a paso y sencillo**.
- **Estilo:** inspirarse en tablas de pricing con insignias de precio y ✓/✕.

---

## 🔄 Cómo actualizar los datos

1. Buscar precios/beneficios vigentes (sitio oficial o Selectra Colombia).
2. Editar los planes en `js/data.js` (`precio`, `datosGB`, `extras`, `oferta`…).
3. Actualizar la `fecha` de cada `fuente` verificada y el `actualizado` global.
4. Guardar y recargar. Si una fuente no está disponible, dejar sus valores como
   estaban (no inventar).

---

## ✅ Cómo verificar cambios (para asistentes)

- Navegador headless disponible: **Chromium en `/opt/pw-browsers`**
  (`chromium-1194/chrome-linux/chrome`). Usar `playwright-core` (instalar en el
  scratchpad, no en el repo).
- Comprobar: los 4 gráficos renderizan (SVG con marcas), la matriz tiene las 6
  columnas con fuente, el cuestionario produce recomendación coherente, y no hay
  errores de consola. Revisar tema claro y oscuro y el responsive.
- Los PNG de vista previa (`preview-*.png`) están en `.gitignore`: son
  artefactos de verificación, no se commitean.

---

## 🚀 Publicación

- **Local:** doble clic en `index.html`, o `python3 -m http.server`.
- **GitHub Pages:** Settings → Pages → rama de trabajo, carpeta `/root`.
- Rama de desarrollo actual: `claude/mobile-plan-comparison-3x4r9b`.
