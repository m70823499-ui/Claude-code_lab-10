# Filtro por presupuesto — Especificación

- **Fecha:** 2026-07-11
- **Estado:** Borrador
- **Autor(es):** m70823499 (con Claude Code)

## 1. Overview

Un control de **precio máximo** que deja al usuario decir "muéstrame solo los
planes hasta $X al mes". Al mover el deslizador, tanto la **matriz comparadora**
como los **gráficos del dashboard** se actualizan para mostrar únicamente los
planes dentro de ese presupuesto. Le ahorra al usuario tener que descartar a ojo
los planes que se salen de su bolsillo.

## 2. Usuarios objetivo

Una persona no técnica que está comparando planes pospago de Tigo y Claro y
tiene un **tope de gasto mensual** en mente. Quiere ver de una vez solo lo que
puede pagar, sin leer todos los planes ni hacer cuentas. Ejemplo típico: "no
quiero pasar de $70.000 al mes; ¿qué me ofrecen dentro de eso?".

## 3. Contexto del problema

Hoy la página muestra **todos** los planes a la vez (precios de $53.900 a
$109.900). Quien tiene un presupuesto ajustado debe recorrer la matriz y los
gráficos descartando mentalmente los que no le sirven. Esa fricción es mayor en
móvil, donde la matriz se ve por partes con scroll. Si no se resuelve, el
usuario con tope de gasto tarda más en llegar a su decisión y puede pasar por
alto el plan que sí le conviene. Un filtro de precio ordena la comparación
alrededor de lo único que ese usuario ya tiene claro: cuánto quiere gastar.

## 4. Alcance v1

**Sí entra:**
- Un **deslizador de precio máximo** ubicado de forma visible, antes de la
  matriz y los gráficos.
- El deslizador va desde el **plan más barato** hasta el **más caro** que haya
  en los datos (los extremos se calculan solos, no son fijos).
- Al mover el deslizador se actualizan **en vivo**: la matriz comparadora y los
  4 gráficos del dashboard, mostrando solo los planes cuyo precio de lista es
  **menor o igual** al máximo elegido.
- Un texto que indique el valor actual del tope (ej. "Hasta $70.000") y cuántos
  planes quedan visibles (ej. "3 de 6 planes").
- Un botón o gesto para **quitar el filtro** (volver a ver todos).
- Funciona en móvil y escritorio, y en tema claro y oscuro.

**No entra (fuera de alcance / para después):**
- Rango mínimo–máximo (por ahora solo tope máximo).
- Rangos predefinidos tipo "Económico / Medio / Premium".
- Filtrar por otros criterios (datos, 5G, roaming, operador).
- Filtrar la sección de cobertura 5G, las consideraciones o el recomendador.
- Recordar el filtro entre visitas.
- Ordenar los planes; el filtro solo muestra/oculta, no reordena.

## 5. Comportamiento esperado

1. El usuario entra a la página y ve, **antes de la comparación**, un deslizador
   con la etiqueta de precio máximo. Al inicio está en el **valor más alto**, así
   que se ven **todos** los planes (nada oculto por defecto).
2. El usuario arrastra el deslizador hacia la izquierda. El texto de arriba
   cambia en vivo (ej. "Hasta $65.900") y muestra cuántos planes quedan
   ("2 de 6 planes").
3. **Al instante**, la matriz comparadora deja de mostrar las columnas de los
   planes que superan ese precio, y los gráficos del dashboard redibujan sus
   barras/puntos solo con los planes que sí caben en el presupuesto.
4. Si el usuario sube de nuevo el tope, los planes ocultos **reaparecen** sin
   recargar la página.
5. En cualquier momento puede pulsar **"Ver todos"** (o llevar el deslizador al
   máximo) para quitar el filtro y volver al estado inicial.
6. El precio que manda el filtro es el **precio de lista mensual**, no el precio
   promocional; esto se aclara junto al control para no confundir (coherente con
   la nota de "la letra pequeña de las ofertas").
7. En móvil el deslizador es cómodo de arrastrar con el dedo y el texto de
   resultado queda visible sin hacer zoom.

## 6. Posibles errores y mitigaciones

- **Ningún plan cae dentro del presupuesto** (tope por debajo del plan más
  barato): en vez de una matriz y gráficos vacíos, se muestra un mensaje claro
  tipo "Ningún plan por debajo de $X. Sube el tope para ver opciones", con acceso
  directo a subir el filtro. Nunca se deja la pantalla en blanco.
- **Un solo plan cae dentro:** la matriz y los gráficos deben verse bien con un
  único plan (sin romper el diseño de columnas ni dejar gráficos con una sola
  barra descuadrada).
- **Confusión precio lista vs. promoción:** como el filtro usa el precio de
  lista, un plan con descuento podría "sentirse" más barato de lo que el filtro
  refleja. Se mitiga con la aclaración del punto 5.6 junto al control.
- **Datos que cambian a futuro:** si se agregan o quitan planes en los datos, los
  extremos del deslizador se recalculan solos; no quedan valores de precio
  escritos a mano que se desactualicen.
- **Uso en móvil:** el control no debe provocar scroll horizontal ni tapar la
  matriz; se ubica de forma que el usuario entienda que afecta a lo que viene
  abajo.
- **Coherencia con "no inventar":** el filtro solo muestra u oculta planes que ya
  existen con su fuente; no crea ni estima precios. No afecta la regla de que
  cada dato lleva su fuente visible.
