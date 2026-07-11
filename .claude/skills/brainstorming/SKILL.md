---
name: brainstorming
description: Fase de arranque para CUALQUIER desarrollo nuevo en este proyecto (nueva sección, gráfico, feature del recomendador, cambio de estructura, etc.). Úsalo SIEMPRE antes de empezar a escribir código nuevo, o cuando el usuario diga "quiero agregar/crear/hacer algo nuevo", "empecemos un desarrollo", "necesito una nueva sección/feature" o similar. Primero hace preguntas para eliminar ambigüedades y al final presenta 2 o 3 alternativas concretas para arrancar. NO escribe código hasta que el usuario elija una alternativa.
---

# Brainstorming — arranque de un desarrollo nuevo

Esta fase existe para **no empezar a picar código a ciegas**. El objetivo es
entender bien qué quiere el usuario, cerrar ambigüedades con preguntas, y
terminar ofreciéndole **2 o 3 caminos concretos** entre los que elegir.

## Reglas de oro (no negociables)

1. **NO escribas código todavía.** Nada de editar archivos ni crear features en
   esta fase. Solo entender, preguntar y proponer. Cuando el usuario elige una
   alternativa, el siguiente paso es el skill `design-spec` (documentar el qué),
   no ponerse a programar.
2. **Primero preguntar, después proponer.** No asumas lo que el usuario quiere
   si hay dudas reales. Pregunta lo mínimo necesario para desambiguar (no
   interrogues de más).
3. **Termina SIEMPRE con 2 o 3 alternativas** claras y comparables, con una
   recomendación tuya. El usuario elige; tú no decides por él.
4. **Respeta el contexto del proyecto.** Lee `CLAUDE.md` antes de proponer:
   sitio estático (doble clic en `index.html`, sin build ni dependencias),
   español en todo, cada dato con su fuente y fecha, gráficos SVG puros, solo
   pospago de Tigo y Claro. Las alternativas deben caber dentro de esas reglas.

## Paso 1 — Entender la idea

Lee `CLAUDE.md` y los archivos relevantes (`js/data.js`, la sección de
`index.html` que aplique, etc.) para tener contexto real antes de preguntar.
Reformula en 1–2 frases lo que entendiste que el usuario quiere, para confirmar
que vamos por el mismo camino.

## Paso 2 — Preguntar para eliminar ambigüedades

Haz preguntas **solo donde haya duda real**. Prefiere la herramienta de
preguntas con opciones cuando existan alternativas claras, para que el usuario
(que no es técnico) responda con un clic. Cubre lo que aplique:

- **Objetivo:** ¿qué problema resuelve o qué quiere lograr el usuario?
- **Alcance:** ¿es una sección nueva, un cambio a algo existente, un gráfico
  nuevo, una pregunta más en el recomendador…? ¿Qué queda fuera?
- **Datos:** ¿de dónde salen los datos? ¿Ya existen en `data.js` o hay que
  conseguirlos con fuente y fecha? (Sin fuente no se agrega el dato.)
- **Ubicación:** ¿dónde vive en la página? ¿En qué sección o entre cuáles?
- **Presentación:** ¿gráfico, tabla, tarjeta, texto…? Recordar: nada de solo
  texto, lo visual es el centro.
- **Prioridad / mínimo viable:** ¿qué es lo imprescindible para una primera
  versión y qué puede esperar?

No hace falta preguntar todo: salta lo que ya esté claro por el contexto o por
lo que dijo el usuario.

## Paso 3 — Presentar 2 o 3 alternativas

Cuando ya no haya ambigüedad, ofrece **2 o 3 caminos** para arrancar. Cada
alternativa lleva:

- **Nombre corto** y en una frase qué es.
- **Qué implica** (archivos que se tocarían, si necesita datos nuevos, si es
  simple o más ambicioso).
- **Pros y contras** (esfuerzo, riesgo, qué tan completo queda).

Las alternativas deben ser **realmente distintas** (p. ej. una mínima y rápida,
una intermedia recomendada, y una más completa), no la misma idea con matices.
Marca cuál **recomiendas** y por qué.

Formato sugerido:

```
Entendí que quieres: <resumen en 1–2 frases>.

Opciones para arrancar:

**A) <nombre>** — <qué es en una frase>
   Implica: <archivos/datos/esfuerzo>.
   ✅ <pros>   ⚠️ <contras>

**B) <nombre>** — ...  (👈 la que recomiendo, porque <razón>)

**C) <nombre>** — ...  (opcional)

¿Cuál seguimos? Cuando elijas, pasamos a documentar el spec (design-spec).
```

Cierra preguntando cuál alternativa quiere. **No empieces a codificar aquí:**
una vez que el usuario elige, el siguiente paso **no es implementar**, sino
pasar al skill `design-spec` para escribir la especificación del camino elegido.
Solo después vienen `design-plan` (el plan técnico) y la construcción.
