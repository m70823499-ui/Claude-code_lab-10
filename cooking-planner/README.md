# Cooking Planner Personal — Fase 1

App personal (un solo usuario, sin cuentas) para **generar una receta ajustada a
tus gustos, cocinarla y registrarla con un rating honesto**.

Implementa la **Fase 1** del roadmap, a partir del diseño entregado en el handoff
de Claude Design (`Cooking Planner.dc.html` + el design system de tokens y
componentes).

La generación de recetas se hace **por detrás (en un backend)**: la clave de la
API vive en el servidor y **el navegador nunca la ve ni te la pide**.

---

## Qué hace (v1)

1. **Configurar preferencias** la primera vez: picante (sí/no), fruta (sí/no),
   formatos favoritos, cocinas favoritas y nivel de habilidad. Se guardan una
   sola vez y se editan después con el ícono de ajustes.
2. **Generar una receta bajo demanda** aplicando siempre esas preferencias.
3. **Vista interactiva**: ingredientes con **porciones ajustables** (las
   cantidades escalan solas), pasos numerados y **timer por paso** cuando hay
   espera o cocción.
4. **Registrar en el historial**: "Ya la cociné" + rating 1–5 (obligatorio) +
   observación opcional. Solo entra al historial lo que confirmas.

Reglas de la spec: no se guardan preferencias sin al menos un formato y una
cocina; la generación **reintenta una vez** sola y, si falla, muestra un error
con botón para reintentar; las porciones no bajan de 1; no se guarda un registro
sin rating.

Fuera de alcance (v2): menú semanal, lista de compras, links de video,
estadísticas mensuales.

---

## Publicar en Vercel (recomendado, todo por detrás)

1. El repo ya está en GitHub. Entra a [vercel.com](https://vercel.com) →
   **Add New… → Project** e importa este repositorio.
2. En **Root Directory** elige la carpeta **`cooking-planner`**.
3. En **Environment Variables** agrega:
   `ANTHROPIC_API_KEY = sk-ant-...` (tu clave de
   [console.anthropic.com](https://console.anthropic.com/settings/keys)).
4. **Deploy**. Vercel sirve la app y usa `api/generate.js` como backend.

La clave queda solo en Vercel; el sitio nunca la expone.

---

## Correr en tu computadora (desarrollo)

Requiere **Node.js 18 o superior**.

1. Configura la clave, de una de estas dos formas:
   - Variable de entorno: `export ANTHROPIC_API_KEY=sk-ant-...`
   - O crea el archivo `cooking-planner/.env` con una línea:
     `ANTHROPIC_API_KEY=sk-ant-...`
2. Desde la carpeta `cooking-planner/`, ejecuta: `node server.js`
   (o `npm start`).
3. Abre **http://localhost:3000**.

El servidor local sirve la app **y** hace de proxy hacia la API (mismo endpoint
`/api/generate` que en Vercel), así que la clave nunca sale del servidor.

> Nota: abrir `index.html` con doble clic (`file://`) muestra la interfaz, pero
> **la generación de recetas no funciona sin el backend** — usa Vercel o
> `node server.js`.

---

## Estructura

```
cooking-planner/
├── index.html        Shell de la página
├── server.js         Backend local (sirve la app + proxy /api/generate). Node 18+, sin dependencias
├── api/
│   └── generate.js   Función serverless de Vercel (mismo proxy, con ANTHROPIC_API_KEY)
├── package.json      Metadatos + script "start"
├── css/
│   ├── tokens.css    Tokens del design system + dark mode
│   └── app.css       Estilos base y de componentes
└── js/
    ├── icons.js      Íconos SVG (copiados del design system)
    ├── api.js        Cliente: llama a /api/generate (nunca a la API directamente)
    └── app.js        Estado, vistas y lógica (onboarding, receta, timers, historial)
```

## Notas de implementación

- **Fiel al handoff**: tokens y componentes se copian del design system; el flujo
  replica `Cooking Planner.dc.html`.
- **Sin framework**: el prototipo era un artifact de React; aquí es JS puro.
- **Backend en dos sabores**: `server.js` para local y `api/generate.js` para
  Vercel; ambos exponen `POST /api/generate { prompt } → { text }` usando la
  clave del servidor. El prototipo usaba `window.claude.complete()`; esto es su
  reemplazo real.
- **Dark mode** automático según el sistema (`prefers-color-scheme`), con los
  mismos valores `DARK_VARS` del diseño.
- **Persistencia** en `localStorage`: `cookingPlanner.prefs.v1`,
  `cookingPlanner.history.v1` (la clave de API **no** se guarda en el navegador).
