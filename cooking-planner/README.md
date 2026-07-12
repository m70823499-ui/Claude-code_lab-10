# Cooking Planner Personal — Fase 1

App personal (un solo usuario, sin cuentas) para **generar una receta ajustada a
tus gustos, cocinarla y registrarla con un rating honesto**. Es un sitio
**estático, sin build ni dependencias**: se abre haciendo doble clic en
`index.html`.

Esta es la implementación de la **Fase 1** del roadmap, a partir del diseño
entregado en el handoff de Claude Design (`Cooking Planner.dc.html` + el design
system de tokens y componentes).

---

## Qué hace (v1)

1. **Configurar preferencias** la primera vez que se abre: picante (sí/no),
   fruta (sí/no), formatos favoritos, cocinas favoritas y nivel de habilidad.
   Se guardan una sola vez y se pueden editar después con el ícono de ajustes.
2. **Generar una receta bajo demanda** aplicando siempre esas preferencias.
3. **Vista interactiva de la receta**: ingredientes con **porciones ajustables**
   (las cantidades escalan solas), pasos numerados y **timer por paso** cuando
   hay espera o cocción.
4. **Registrar en el historial**: confirmar "Ya la cociné", poner un rating de
   1 a 5 estrellas y, opcional, una observación. Solo entra al historial lo que
   confirmas.

Reglas de la spec ya implementadas: no se puede guardar preferencias sin al
menos un formato y una cocina; la generación **reintenta una vez** sola y, si
falla de nuevo, muestra un error con botón para reintentar; las porciones no
bajan de 1; no se guarda un registro sin rating.

Fuera de alcance (v2): menú semanal, lista de compras, links de video,
estadísticas mensuales.

---

## Cómo usarlo

1. Doble clic en `index.html` (o `python3 -m http.server` y abrir el navegador).
2. La generación de recetas usa la **API de Anthropic**. Como el sitio es
   estático (sin servidor propio), la llamada se hace directo desde tu navegador
   con **tu clave de API**:
   - Al pulsar "Generar receta" por primera vez te pedirá la clave.
   - También puedes configurarla desde **Preferencias → Clave de API**.
   - La clave se guarda **solo en tu navegador** (`localStorage`) y se envía
     únicamente a `api.anthropic.com`. Puedes crear una en
     [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

Sin clave, todo el resto de la app funciona (configurar preferencias, ver el
historial); solo la generación necesita la clave.

---

## Estructura

```
cooking-planner/
├── index.html        Shell de la página (carga tokens, estilos y scripts)
├── css/
│   ├── tokens.css    Tokens del design system (colores, tipografía, radios, sombras) + dark mode
│   └── app.css       Estilos base y de componentes (Button, Tag, Badge, IngredientRow, StatsBar, pasos)
└── js/
    ├── icons.js      Set de íconos SVG (copiado del design system)
    ├── api.js        Generación de receta vía API de Anthropic (clave en localStorage)
    └── app.js        Estado, vistas y lógica (onboarding, receta, timers, historial)
```

## Notas de diseño / implementación

- **Fiel al handoff**: los tokens (`css/tokens.css`) y los componentes se copian
  del design system entregado; el flujo y la lógica replican
  `Cooking Planner.dc.html`.
- **Sin framework**: el prototipo era un artifact de React; aquí se reescribió en
  JS puro para que sea un sitio estático de doble clic, sin bundler ni imports.
- **Dark mode** automático según el sistema (`prefers-color-scheme`), con los
  mismos valores `DARK_VARS` del diseño.
- **API real**: el prototipo llamaba `window.claude.complete()` (runtime del
  artifact). En la app real eso se reemplaza por una llamada directa a la
  Messages API con `anthropic-dangerous-direct-browser-access`.
- **Persistencia**: preferencias e historial en `localStorage`
  (`cookingPlanner.prefs.v1`, `cookingPlanner.history.v1`); la clave en
  `cookingPlanner.apiKey.v1`.
