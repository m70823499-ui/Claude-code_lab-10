---
name: verify-after-changes
description: Fase de prueba que se usa cuando se considera TERMINADA la implementación de un plan y hay que verificar que los cambios funcionan de verdad. Úsalo cuando el usuario diga "ya terminé, probemos", "verifica los cambios", "prueba que funcione", "revisa que quedó bien" o similar, al cerrar un desarrollo. Levanta el servidor, elige 5 casos de prueba importantes y los prueba directamente en el navegador; recoge el resultado, lo compara contra el plan y el spec, y con ese feedback arregla lo que falle o da luz verde para terminar.
---

# Verify-after-changes — probar los cambios en el navegador

Este skill es la **fase de prueba al cerrar una implementación**. Asume que el
código ya está escrito y que existe un objetivo claro: el **plan** en
`docs/plans/YYYY-MM-DD-title.md` y su **spec** de referencia en
`docs/specs/YYYY-MM-DD-title.md` (mismo título/slug entre ambos). Su trabajo es
**comprobar en el navegador real** que lo construido cumple ese objetivo, y
luego **arreglar lo que falle** o **dar luz
verde**.

No es una revisión de estilo ni de copy (para eso está `revision-final`): aquí
el foco es **¿funciona lo que acabamos de construir y cumple lo prometido?**.

## Reglas de oro (no negociables)

1. **Probar de verdad en el navegador, no adivinar desde el código.** Levanta el
   sitio y ejercítalo. Si el navegador no arranca, dilo claramente y marca la
   verificación como incompleta; no inventes que "pasó".
2. **Exactamente 5 casos de prueba importantes.** Elige los 5 que más importan
   para el objetivo de este cambio (no 20 triviales). Cada caso: qué se prueba,
   qué se espera, qué pasó (✅/❌), y evidencia (captura o dato leído del DOM).
3. **Comparar contra el plan y el spec.** El criterio de éxito no es "no
   explotó", es "hace lo que el plan (`docs/plans/…`) y el spec (`docs/specs/…`)
   dijeron". Lee ambos y contrasta caso por caso. Si falta alguno, usa el que
   exista (o el objetivo acordado).
4. **Con el feedback, actuar:**
   - Lo que **falle o no alcance** el objetivo → **arréglalo**, y vuelve a
     probar ese caso hasta que pase (re-verifica, no asumas).
   - Si un arreglo es **ambiguo o grande** (cambia arquitectura o el alcance),
     **pregunta al usuario** antes de tocar, con `AskUserQuestion`.
   - Si todo cumple → **da luz verde** explícita para terminar.
5. **Respeta el contexto del proyecto.** Lee `CLAUDE.md`: sitio estático (doble
   clic en `index.html`), español, datos con fuente, gráficos SVG. Prueba en
   **tema claro y oscuro** y en **móvil (375px) y escritorio**.

## Cómo probar (navegador headless)

Chromium ya está en el entorno: `/opt/pw-browsers`
(`chromium-1194/chrome-linux/chrome`). Usa `playwright-core` instalado **en el
scratchpad**, nunca en el repo.

Pasos:

1. Instala `playwright-core` en el scratchpad y escribe un script que sirva el
   sitio (`python3 -m http.server` desde la raíz, o un servidor estático propio)
   y lo abra con Chromium.
2. Recoge errores de consola (`page.on('console')` y `page.on('pageerror')`) —
   un error de consola relevante es un ❌.
3. Toma capturas a `scratchpad/preview-*.png` (están en `.gitignore`, no se
   commitean) como evidencia de cada caso.
4. Prueba en **dos viewports** (móvil ~375×812 y escritorio ~1280×800) y en
   **ambos temas** (alternando el toggle 🌙/☀️) cuando el cambio lo amerite.

## Paso 1 — Elegir los 5 casos

Antes de correr nada, define los 5 casos y **enséñaselos al usuario** (breve).
Elígelos mirando el objetivo del cambio y el spec. Buenas fuentes de casos:

- El **comportamiento esperado** del spec (cada recorrido es candidato a caso).
- Los **errores y mitigaciones** del spec (ej. "sin resultados", "un solo
  plan") — probar que la mitigación existe.
- Que el cambio **renderiza** (SVG con marcas > 0, sin NaN, sin roto).
- **Móvil:** que no haya scroll horizontal y el control sea usable con el dedo.
- **No regresión:** que lo que ya funcionaba (otras secciones) siga bien.

## Paso 2 — Ejecutar y recoger feedback

Corre los 5 casos en el navegador. Para cada uno anota: **esperado vs. real**,
✅ o ❌, y la evidencia. Sé honesto: un caso a medias es ❌.

## Paso 3 — Comparar con plan y spec

Pon los resultados al lado de lo prometido:

- ¿Cada punto del **alcance v1** del spec está cubierto?
- ¿Las **mitigaciones** de error se comportan como se describió?
- ¿Quedó algo del plan **sin cumplir** o a medias?

## Paso 4 — Arreglar o dar luz verde

- **Si hay ❌:** arregla la causa, vuelve a levantar el sitio y **re-prueba solo
  esos casos** (y cualquiera que el arreglo pudiera afectar) hasta que pasen. No
  cierres con casos en rojo. Si el arreglo es ambiguo o grande, pregunta primero.
- **Si todo ✅ y cumple plan + spec:** da **luz verde** clara para terminar.

## Formato de entrega

```
# Verificación — <título del cambio> · <fecha>
Probado con: navegador headless (móvil 375px + escritorio), tema claro y oscuro.
Referencia: docs/plans/AAAA-MM-DD-title.md · docs/specs/AAAA-MM-DD-title.md

## Casos de prueba (5)
1. <caso> — Esperado: <...> · Real: <...> — ✅/❌  (evidencia: preview-x.png)
2. ...
3. ...
4. ...
5. ...

## Comparación con plan y spec
- Alcance v1 cubierto: <sí/parcial + qué falta>
- Mitigaciones de error: <cuáles se probaron y cómo respondieron>

## Resultado
🟢 Luz verde — cumple el objetivo, listo para terminar.
  — o —
🔴 Falta: <lista de ❌ y qué se va a arreglar>. (Se corrige y se re-prueba.)
```

Cierra con el resultado claro: **luz verde**, o **la lista de arreglos** que vas
a hacer (y luego re-verificas).
