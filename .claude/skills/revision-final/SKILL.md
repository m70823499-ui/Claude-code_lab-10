---
name: revision-final
description: Revisión final del sitio de comparación de planes móviles (Tigo/Claro) antes de publicar. Úsalo cuando el usuario pida una "revisión final", "revisa el sitio completo", "qué falta antes de publicar" o similar. Recorre un checklist de 5 puntos (móvil, botones/enlaces, textos de relleno, imágenes/SVG, tono del copy) usando un navegador headless y entrega una lista de problemas priorizada por severidad. NO corrige nada hasta que el usuario apruebe.
---

# Revisión final del sitio

Auditoría de calidad de todo el sitio contra un checklist fijo de 5 puntos.
Este es un sitio estático (se abre con doble clic en `index.html`); todo el
render de gráficos es **SVG generado por JS**, no imágenes rasterizadas.

## Reglas de oro (no negociables)

1. **NO arregles nada.** Solo diagnostica y reporta. Espera la aprobación
   explícita del usuario antes de tocar código. Si al final el usuario aprueba,
   ahí sí corriges.
2. **Entrega una lista priorizada** en tres niveles: **🔴 Crítico**,
   **🟡 Medio**, **⚪ Menor**. Ordena de más grave a menos. Cada problema lleva:
   dónde está (archivo:línea o sección), qué pasa, y por qué importa.
3. **Verifica de verdad con navegador headless.** No adivines desde el código:
   abre el sitio y míralo. Si por alguna razón el navegador no arranca, dilo
   claramente en el reporte y marca esos puntos como "no verificado en vivo".
4. **No inventes problemas.** Si un punto del checklist está OK, dilo. Un
   reporte honesto puede tener secciones vacías.

## Cómo verificar (navegador headless)

Chromium ya está en el proyecto: `/opt/pw-browsers` (`chromium-1194/chrome-linux/chrome`).
Usa `playwright-core` instalado **en el scratchpad**, nunca en el repo.

Pasos:

1. Instala playwright-core en el scratchpad y escribe un script de verificación
   que sirva el sitio (`python3 -m http.server` desde la raíz del repo) y lo
   abra con Chromium.
2. Prueba en **dos viewports**: móvil (~375×812) y escritorio (~1280×800).
3. En cada tema (**claro y oscuro**, alternando el toggle 🌙/☀️):
   - Toma capturas a `scratchpad/preview-*.png` (están en `.gitignore`, no se
     commitean).
   - Recoge errores de consola (`page.on('console')` y `page.on('pageerror')`).
4. Deja el sitio listo para inspección; el análisis de cada punto va abajo.

## El checklist (5 puntos)

### 1. 🖥️➡️📱 Se ve bien en móvil (375px)
- El `<body>` **no** hace scroll horizontal (nada se desborda del ancho).
- Encabezado sticky y subnavegación usables; los enlaces no se encavalgan.
- Las grillas colapsan a 1 columna (gráficos, recomendador).
- La matriz de pricing (`#comparador`) hace scroll horizontal **dentro de su
  contenedor**, no rompe la página.
- Texto legible sin zoom; botones/opciones con área tocable suficiente.

### 2. 🔗 Todos los botones/enlaces llevan a donde deben
- Los anclas de la subnavegación existen y saltan a su sección:
  `#dashboard` → Gráficos, `#comparador` → Comparador,
  `#consideraciones` → A tener en cuenta, `#recomendador` → Recomiéndame.
  (Comprueba que cada `href="#..."` tenga su `id` correspondiente.)
- El toggle de tema (🌙/☀️) alterna claro/oscuro y persiste el estado esperado.
- Botones del recomendador (opciones del cuestionario) responden y recalculan.
- Enlaces de **Fuente** en la matriz y en el resultado apuntan a URLs reales
  (revisa que no queden `#`, `javascript:void(0)` o vacíos). No hace falta
  cargar cada URL externa, pero sí que el `href` sea una URL plausible.
- Ningún enlace roto o `href` vacío/placeholder.

### 3. ✍️ No hay textos de relleno
- Busca "lorem ipsum", "placeholder", "TODO", "TBD", "xxx", "asdf", "texto de
  ejemplo", "cambiar esto", "descripción aquí" y similares en HTML y en los
  strings de `js/*.js` (sobre todo `data.js`, `comparison.js`, `recommender.js`).
- Revisa que ningún plan, consideración, oferta o razón del recomendador tenga
  texto de marcador de posición en vez de contenido real.

### 4. 🖼️ Las imágenes cargan (SVG + futuras imágenes)
- **SVG (lo de hoy):** los 4 gráficos del `#dashboard` renderizan con marcas
  visibles (barras/puntos con dimensiones > 0), no aparecen vacíos ni con NaN
  en coordenadas. La dispersión muestra puntos y leyenda. Los ✓/✕ de la matriz
  se ven.
- **Imágenes rasterizadas (si algún día se agregan):** cada `<img>` carga sin
  roto (`naturalWidth > 0`), tiene `alt`, y ningún `background-image` apunta a
  una ruta inexistente. Hoy no debería haber ninguna; si aparece una rota,
  es problema.
- Cero errores de consola relacionados con recursos que fallan al cargar.

### 5. 🗣️ El copy usa mi tono (según CLAUDE.md)
La referencia de tono es **CLAUDE.md → sección "Preferencias del usuario"**.
Lee esa sección cada vez y contrasta el copy contra estos criterios:
- **Español** en toda la interfaz y el contenido (nada en inglés colado).
- **No inventar información:** cada dato con su **fuente y fecha** visibles. Si
  hay una afirmación de precio/beneficio sin `fuente`, es un hallazgo.
- **Claro y no técnico:** el usuario no es técnico; señala jerga innecesaria o
  frases confusas.
- **Alcance correcto:** solo planes **pospago**, solo **Tigo y Claro**. Marca
  cualquier mención fuera de alcance (prepago, otros operadores).
- Tono informativo y directo, coherente con el resto del sitio; sin promesas
  exageradas ni lenguaje de marketing agresivo.

## Formato de entrega

Presenta el reporte así (omite un nivel si está vacío, pero dilo):

```
# Revisión final — <fecha>
Verificado con: navegador headless (móvil 375px + escritorio), tema claro y oscuro.

## 🔴 Crítico (rompe uso o publica algo falso/incompleto)
1. [<sección / archivo:línea>] Qué pasa. Por qué importa.

## 🟡 Medio (funciona pero debería arreglarse antes de publicar)
...

## ⚪ Menor (pulido, no bloquea)
...

## ✅ Puntos del checklist sin problemas
- (ej.) Móvil: sin scroll horizontal, grillas colapsan bien.
```

Cierra preguntando: **"¿Apruebas que empiece a corregir? ¿Todo o solo algunos?"**
No toques código hasta la respuesta.
