# 📋 Especificación — Comunidad (registro, experiencias y foros)

Especificación funcional de la sección **Comunidad** del sitio *Monitor de Planes
Móviles (Tigo vs Claro)*. Recoge lo acordado en la fase de brainstorming y lo que
efectivamente se construyó. Sirve como referencia de **qué debe hacer** la
funcionalidad y **cómo se valida**.

- **Estado:** implementado (Fase 0 y Fase 1 del `PLAN.md`).
- **Rama:** `claude/basic-signup-login-d4xw26`.
- **Última actualización de este documento:** 2026-07-11.

---

## 1. Objetivo

Permitir que las personas que visitan el sitio **se registren**, **compartan sus
experiencias** con los planes de Tigo y Claro y **debatan en foros por tema**,
para complementar los datos objetivos (precios, GB, cobertura) con la voz real de
los usuarios.

## 2. Alcance

Dentro de una nueva sección **"Comunidad"** (al final de la página única), con dos
pestañas que comparten el mismo panel de inicio de sesión:

1. **Autenticación** — registro e inicio de sesión con usuario y contraseña.
2. **Experiencias** — muro de comentarios con operador y valoración de estrellas.
3. **Foros** — hilos de discusión organizados por tema.

## 3. Fuera de alcance (por ahora)

- **Compartir entre personas/dispositivos** (requiere servidor — ver Fase 2 del
  `PLAN.md`). Hoy todo es **local** al navegador.
- Seguridad real de contraseñas, recuperación de contraseña, verificación de
  correo.
- Moderación, reportes, roles de administrador.
- "Me gusta"/votos, notificaciones, perfiles de usuario.
- Preguntas y respuestas como formato separado de los foros.

---

## 4. Reglas de negocio y validaciones

### 4.1 Registro (signup)
- Usuario: **3 a 20 caracteres**; solo letras, números, punto, guion y guion bajo.
- Contraseña: **mínimo 4 caracteres**.
- El usuario debe ser **único** (no distingue mayúsculas/minúsculas).
- Al registrarse, la sesión queda **iniciada** automáticamente.

### 4.2 Inicio de sesión (login)
- Valida usuario + contraseña; si no coinciden, muestra
  *"Usuario o contraseña incorrectos."*.

### 4.3 Sesión
- El panel de sesión (login o barra "Hola, usuario · Salir") es **compartido** por
  ambas pestañas.
- "Salir" cierra la sesión y vuelve al panel de login.

### 4.4 Experiencias (muro)
- Solo un usuario con sesión puede **publicar**.
- Cada comentario tiene: **texto** (mín. 3 caracteres), **operador**
  (General / Tigo / Claro) y **valoración** (1–5 estrellas, por defecto 5).
- El muro se puede **filtrar** por operador (Todos / General / Tigo / Claro).
- El **autor** puede **editar** (en línea) y **borrar** su propio comentario; los
  editados muestran *"(editado)"*. Nadie puede editar/borrar lo ajeno.

### 4.5 Foros (hilos por tema)
- **Temas fijos:** General, Cobertura, Ofertas, Atención al cliente, Planes.
- Solo un usuario con sesión puede **crear temas** y **responder**.
- Crear tema: **título** (mín. 5 caracteres), **categoría** y **mensaje inicial**
  (mín. 5 caracteres). Al crearlo se abre el hilo.
- Responder: **mensaje** (mín. 2 caracteres).
- **Navegación:** lista de temas → detalle del hilo (con botón "← Volver").
- **Lista:** muestra por hilo la categoría, autor, nº de respuestas y última
  actividad. Incluye **buscador por título** (en vivo), **filtro por categoría con
  contadores** y **orden** (más activos / más recientes).
- **Detalle:** el primer mensaje se marca como *"autor"*. Se puede **citar**
  cualquier mensaje (rellena el cuadro de respuesta).
- El **autor de un mensaje** puede **editar** su mensaje y **borrar** sus
  respuestas; el **autor del tema** puede **borrar el tema completo**. Los
  mensajes editados muestran *"(editado)"*. Borrar acciones piden confirmación.

---

## 5. Historias de usuario

- Como visitante, quiero **crear una cuenta** para poder participar.
- Como usuario, quiero **iniciar y cerrar sesión**.
- Como usuario, quiero **compartir mi experiencia** con un operador y una
  valoración, y **editarla o borrarla** después.
- Como usuario, quiero **filtrar las experiencias** por operador.
- Como usuario, quiero **abrir un tema de discusión** en una categoría y que otros
  respondan.
- Como usuario, quiero **buscar y filtrar** temas, y **ordenarlos** por actividad.
- Como usuario, quiero **citar, editar o borrar** mis mensajes y **borrar mis
  temas**.

---

## 6. Modelo de datos (localStorage)

- `comunidad-usuarios`: `[{ usuario, hash, creado }]`
- `comunidad-sesion`: `"usuario"` (sesión actual)
- `comunidad-comentarios`:
  `[{ id, usuario, texto, operador, estrellas, fecha, editado? }]`
- `comunidad-hilos`:
  `[{ id, titulo, tema, usuario, fecha, mensajes:[{ usuario, texto, fecha, editado? }] }]`
  (`mensajes[0]` es el mensaje inicial del hilo)

> El `hash` de la contraseña es una **ofuscación (djb2 + sal), NO criptográfica**.

---

## 7. Requisitos no funcionales

- **Idioma:** español en toda la interfaz.
- **Sitio estático:** funciona abriendo `index.html` con doble clic (sin servidor
  ni build). Módulos JS como IIFE (`window.Auth`, `window.Foros`,
  `window.Comunidad`).
- **Local:** todos los datos viven en el navegador; **no se comparten** entre
  personas ni dispositivos. Debe **advertirse en la interfaz** que es un prototipo
  local y que no se usen contraseñas reales.
- **Diseño:** respeta el estilo del sitio (tema claro/oscuro, responsive, estilo
  tipo tabla de pricing con pastillas y ✓/✕).
- **Arquitectura lista para servidor:** el almacenamiento está aislado para poder
  reemplazarlo por una API sin rehacer la interfaz (Fase 2).

---

## 8. Criterios de aceptación (verificables)

1. Registrarse con datos válidos inicia sesión y muestra el compositor.
2. Registro/login inválidos muestran un mensaje de error claro.
3. Publicar una experiencia la muestra en el muro con usuario, fecha, operador y
   estrellas; el filtro por operador funciona.
4. El autor puede editar y borrar su experiencia; otro usuario no ve esas
   acciones.
5. Crear un tema lo abre; responder incrementa el contador de respuestas.
6. La lista muestra contadores por categoría, permite buscar por título (sin
   perder el foco) y ordenar por activos/recientes.
7. Citar rellena el cuadro de respuesta; editar marca "(editado)"; borrar
   respuesta y borrar tema funcionan (con confirmación).
8. Todo persiste al recargar la página.
9. No hay errores de consola; funciona en tema claro/oscuro y en móvil.

> Estado: **verificado** con navegador headless (registro/login, experiencias,
> foros, editar/borrar, propiedad, persistencia, temas y responsive).

---

## 9. Referencias

- `PLAN.md` — hoja de ruta (fases y próximos pasos).
- `CLAUDE.md` — guía técnica: estructura, módulos y decisiones de diseño.
