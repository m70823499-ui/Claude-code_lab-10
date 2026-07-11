---
name: design-spec
description: Redacta un documento de especificación desde el punto de vista del usuario, DESPUÉS de que ya hay claridad sobre el problema y lo que se quiere hacer (normalmente tras el skill brainstorming, o cuando el usuario ya eligió qué construir). Úsalo cuando el usuario diga "hagamos la especificación", "documentemos qué vamos a construir", "escribe el spec" o similar, antes de ponerse a programar. Genera el archivo `docs/specs/YYYY-MM-DD-title.md` con 6 secciones fijas. Se centra en el QUÉ y el PARA QUIÉN, no en el CÓMO técnico.
---

# Design-spec — especificación desde el punto de vista del usuario

Este skill convierte una idea ya clara en un **documento de especificación**
escrito **para el usuario, no para el programador**. Describe qué debe pasar y
para quién, no cómo se implementa por dentro.

Es el paso natural **después** de tener claridad (por ejemplo, tras correr el
skill `brainstorming` y haber elegido un camino). Si todavía hay ambigüedad
sobre qué construir, primero usa `brainstorming`; este skill asume que el qué ya
está decidido.

## Reglas de oro (no negociables)

1. **Punto de vista del usuario.** Escribe pensando en la persona que usa el
   sitio, no en la arquitectura. Nada de nombres de funciones, archivos JS,
   estructuras de datos ni detalles de implementación. El "cómo técnico" queda
   fuera.
2. **No programar todavía.** Este skill solo produce el documento. El código
   llega después, ya con el spec como guía.
3. **Ruta y nombre exactos:** el archivo final va en
   `docs/specs/YYYY-MM-DD-title.md`. La fecha es la de hoy (usa la fecha real de
   la sesión). El `title` es un slug corto en minúsculas y con guiones
   (ej. `cobertura-5g`, `filtro-por-presupuesto`). Crea la carpeta
   `docs/specs/` si no existe.
4. **Las 6 secciones, en este orden, siempre.** Ninguna se omite. Si una no
   aplica, dilo explícitamente ("No aplica porque…") en vez de borrarla.
5. **Respeta el contexto del proyecto.** Lee `CLAUDE.md` antes de escribir:
   sitio estático de comparación de planes pospago (solo Tigo y Claro), en
   español, cada dato con su fuente y fecha, lo visual es el centro. El spec
   debe caber dentro de esas reglas y de ese lenguaje.
6. **Concreto, no relleno.** Sin "lorem ipsum" ni frases vacías. Si falta
   información para llenar una sección, **pregúntale al usuario** antes de
   inventarla.

## Antes de escribir

1. Lee `CLAUDE.md` y, si aplica, los archivos o la sección de la página que
   toque la idea, para anclar el spec en la realidad del proyecto.
2. Confirma en 1–2 frases qué se va a especificar. Si hay huecos importantes
   (para quién es, qué entra y qué no), pregúntalos con la herramienta de
   preguntas antes de redactar. No inventes.

## Estructura del documento

El archivo `docs/specs/YYYY-MM-DD-title.md` lleva un encabezado y **estas 6
secciones exactas**:

```markdown
# <Título legible> — Especificación

- **Fecha:** YYYY-MM-DD
- **Estado:** Borrador
- **Autor(es):** <quién>

## 1. Overview
Resumen en 2–4 frases: qué es esto y qué valor entrega al usuario. Que se
entienda leyendo solo esta sección.

## 2. Usuarios objetivo
Para quién es. Describe a la persona y su necesidad (ej. "alguien comparando
planes que quiere saber si tendrá 5G donde vive"). Nada técnico.

## 3. Contexto del problema
Qué problema o fricción existe hoy, desde la vivencia del usuario. Por qué vale
la pena resolverlo. Qué pasa si no se hace.

## 4. Alcance v1
Lista clara de lo que SÍ entra en la primera versión y, aparte, lo que NO entra
(fuera de alcance / para después). Ser explícito con lo que queda fuera es tan
importante como lo que entra.

## 5. Comportamiento esperado
Qué ve y qué puede hacer el usuario, paso a paso, en lenguaje de usuario.
Describe la experiencia (qué aparece, cómo reacciona, qué información recibe),
no la implementación. Útil escribirlo como recorridos ("El usuario abre… ve…
elige… entonces…").

## 6. Posibles errores y mitigaciones
Qué puede salir mal desde la óptica del usuario (dato faltante o sin fuente,
fuente caída, sin resultados, contenido que no carga, uso en móvil…) y cómo se
maneja cada caso para que la experiencia siga siendo clara y honesta.
```

## Al terminar — approval gate

Escribe el archivo en la ruta correcta y **muéstrale al usuario un resumen** de
cada sección (no lo dejes solo en disco). Luego abre una **compuerta de
aprobación**: el spec no avanza hasta que el usuario decida. Las opciones son
solo dos:

- **Iterar** — el usuario pide ajustes en una o varias secciones. Aplícalos
  sobre el mismo archivo y **vuelve a abrir la compuerta** (muestra el resumen y
  vuelve a preguntar). Se repite las veces que haga falta; el spec sigue en
  estado *Borrador*.
- **Aprobar y continuar** — el usuario aprueba. Marca el spec como aprobado
  (puedes cambiar el `Estado` a "Aprobado") y **pasa al skill `design-plan`**
  para generar el plan de implementación a partir de este spec.

Cierra siempre preguntando de forma explícita, por ejemplo:
**"¿Apruebas el spec y pasamos a generar el plan (design-plan), o iteramos
alguna sección primero?"**

**Nunca** empieces a implementar código desde este skill: aprobar el spec lleva
a `design-plan`, no directo a construir.
