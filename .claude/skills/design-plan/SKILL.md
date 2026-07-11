---
name: design-plan
description: Genera el plan de implementación a partir de un spec YA APROBADO por el usuario. Úsalo justo después de que el usuario aprueba el spec en design-spec (o cuando diga "hagamos el plan", "arma el plan de implementación", "pasemos a construir"). A diferencia del spec (que es el QUÉ desde el usuario), el plan es el CÓMO técnico: guarda el archivo `docs/plans/YYYY-MM-DD-title.md` con objetivo, contexto, el spec de referencia y la lista detallada de tareas a implementar. No escribe código todavía; produce el plan que guiará la construcción.
---

# Design-plan — plan de implementación desde un spec aprobado

Este skill convierte un **spec aprobado** en un **plan de implementación**
técnico y accionable. Es el puente entre "ya sabemos qué construir y para quién"
(el spec) y ponerse a programar.

**Requisito de entrada:** debe existir un spec aprobado (normalmente en
`docs/specs/YYYY-MM-DD-title.md`). Si el spec aún no está aprobado, primero usa
`design-spec` y su approval gate; este skill asume el "qué" ya cerrado.

## Reglas de oro (no negociables)

1. **Parte de un spec aprobado.** Lee el spec de referencia completo antes de
   planear. Si no hay spec o no está aprobado, detente y vuelve a `design-spec`.
2. **Aquí sí es técnico.** A diferencia del spec (punto de vista del usuario),
   el plan habla de **cómo**: archivos que se tocan, funciones, datos, orden de
   trabajo. Es para quien va a programar.
3. **Ruta y nombre exactos:** el plan va en `docs/plans/YYYY-MM-DD-title.md`.
   Usa la **misma fecha y el mismo `title` (slug)** que el spec, para que sea
   fácil emparejarlos (ej. spec `2026-07-11-filtro-por-presupuesto.md` ↔ plan
   `2026-07-11-filtro-por-presupuesto.md`). Crea `docs/plans/` si no existe.
4. **Las 4 secciones, en este orden, siempre:** Objetivo, Contexto del problema,
   Spec de referencia, Lista de tareas. Ninguna se omite.
5. **Tareas con detalle real.** Cada tarea debe ser accionable: qué archivo se
   toca, qué se agrega/cambia, y cómo se sabrá que quedó. Nada de "hacer el
   filtro" a secas. Respeta la arquitectura del proyecto (ver `CLAUDE.md`:
   `data.js` es la fuente de datos, módulos IIFE `window.*`, gráficos SVG,
   orden de carga de scripts, sitio estático sin build).
6. **No programar todavía.** Este skill produce el plan; el código llega después.

## Antes de escribir

1. Lee el **spec aprobado** y `CLAUDE.md` (arquitectura, módulos, reglas).
2. Mira los archivos reales que el cambio va a tocar (`index.html`, `js/*.js`,
   `css/styles.css`), para que las tareas apunten a la realidad del código y no
   a suposiciones.
3. Confirma en 1 frase el objetivo del plan.

## Estructura del documento

El archivo `docs/plans/YYYY-MM-DD-title.md` lleva encabezado y **estas 4
secciones exactas**:

```markdown
# <Título legible> — Plan de implementación

- **Fecha:** YYYY-MM-DD
- **Estado:** Borrador
- **Spec:** docs/specs/YYYY-MM-DD-title.md

## 1. Objetivo
Qué se va a construir y para qué, en 2–3 frases. El resultado concreto esperado
al terminar el plan.

## 2. Contexto del problema
Resumen breve del problema y del estado actual del código relevante (qué existe
hoy, qué módulos/archivos entran en juego). Suficiente para que quien
implemente entienda dónde encaja el cambio.

## 3. Spec de referencia
Enlace al spec aprobado (`docs/specs/…`) y un resumen de 3–5 puntos clave que el
plan debe cumplir (alcance v1, comportamiento esperado, mitigaciones críticas).
El plan no puede contradecir el spec; si algo no cuadra, se vuelve al spec.

## 4. Lista de tareas a implementar
Tareas numeradas, en orden de ejecución. Cada tarea con:
- **Qué:** el cambio concreto.
- **Dónde:** archivo(s) y, si aplica, función/sección.
- **Detalle:** cómo se hace (lógica, datos, estilos) sin escribir el código.
- **Hecho cuando:** criterio observable de que quedó (qué se ve o se comprueba).

Incluye, cuando aplique: cambios en datos (`data.js`), UI (`index.html`),
lógica/render (`js/*.js`), estilos (`css/styles.css`), y una tarea final de
**verificación** (probar en navegador — se puede delegar a `verify-after-changes`).
```

## Al terminar

1. Escribe el archivo en la ruta correcta y **muestra al usuario un resumen** de
   las tareas (no lo dejes solo en disco).
2. Cierra preguntando: **"¿Apruebas este plan para empezar a implementar, o
   ajustamos alguna tarea?"** No escribas código hasta que el usuario apruebe.
