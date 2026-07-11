# 🗺️ Plan — Comunidad (login, experiencias y foros)

Hoja de ruta de la sección **Comunidad** del sitio (Tigo vs Claro). Resume lo
que ya está hecho y los próximos pasos priorizados, para retomar el trabajo sin
perder contexto. Escrito en lenguaje simple.

> **Recordatorio clave:** hoy todo es **solo local** (se guarda en el navegador
> con `localStorage`). Los usuarios, comentarios y foros **no se comparten** entre
> personas ni computadoras. Es un prototipo funcional; el salto a "compartir de
> verdad" está descrito abajo en la Fase 2.

---

## ✅ Fase 0 — Hecho (ya está en el sitio)

Rama: `claude/basic-signup-login-d4xw26`.

- **Registro e inicio de sesión** (usuario + contraseña), local. → `js/auth.js`
- **Pestaña "Experiencias"**: muro de comentarios con operador (Tigo/Claro/
  General) y valoración de estrellas, filtrable. → `js/comunidad.js`
- **Pestaña "Foros"**: hilos de discusión por tema (General, Cobertura, Ofertas,
  Atención al cliente, Planes), con navegación lista → detalle, buscador en vivo,
  filtro por categoría, crear tema y responder, contador de respuestas y última
  actividad. → `js/foros.js`
- El panel de login es **compartido** por ambas pestañas.
- Verificado con navegador headless (tema claro/oscuro y móvil), sin errores.

**Limitaciones conocidas (a propósito, por ser prototipo local):**
- No se comparte entre navegadores/personas.
- La contraseña se guarda con una huella de ofuscación **no criptográfica** →
  no es seguridad real; no usar contraseñas reales.
- No hay editar/borrar, ni moderación, ni recuperación de contraseña.

---

## 🔜 Fase 1 — Mejoras del foro sin salir de "local" (opción C)

Trabajo acotado, sigue sin servidor. Bueno como siguiente paso rápido.

- **Categorías con contadores**: mostrar cuántos temas hay por categoría.
- **Orden configurable**: "más recientes" vs "más activos".
- **Responder citando** un mensaje anterior.
- **Editar / borrar** tus propios comentarios y temas.
- **Contador de respuestas** ya existe; añadir "sin leer" o similar es opcional.

Esfuerzo: bajo–medio. Riesgo: bajo. Todo en `js/foros.js` + estilos.

---

## 🚀 Fase 2 — Compartir de verdad entre personas (el salto grande)

Esto es lo que hace que los foros/comentarios los vean **todos**. Requiere algo
más que un sitio estático: un **servidor con base de datos**. Opciones típicas
(de menor a mayor esfuerzo):

1. **Backend "sin servidor propio" (BaaS)** — servicios como Supabase o Firebase
   dan base de datos + autenticación reales sin montar un servidor desde cero.
   Es el camino más corto para pasar de local a compartido.
2. **API + base de datos propias** — más control, más trabajo (hosting, seguridad,
   mantenimiento).

Qué habría que hacer (independiente de la opción):
- Reemplazar el guardado local por llamadas a la API. **La arquitectura ya está
  preparada**: `js/auth.js` aísla el almacenamiento y `js/foros.js` /
  `js/comunidad.js` leen/escriben por funciones concretas → se cambia el "cómo se
  guarda" sin rehacer la pantalla.
- **Autenticación y contraseñas de verdad** (hash seguro en el servidor, nunca en
  el navegador).
- **Moderación** (reportar/ocultar contenido) y reglas básicas anti-spam.
- Nota: al dejar de ser estático, el sitio ya **no se abriría con doble clic**;
  habría que publicarlo con su servidor. Evaluar si compensa.

Esfuerzo: alto. Es una decisión de producto, no solo técnica.

---

## 💡 Ideas para más adelante (sin prioridad)

- **Preguntas y respuestas** como formato aparte de los foros.
- **"Me gusta" / votos** en temas y respuestas.
- **Perfil de usuario** (avatar, historial de aportes).
- **Paginación / carga progresiva** cuando haya muchos temas.
- **Notificaciones** de respuestas a tus temas (requiere Fase 2).

---

## 🧭 Cómo retomar

1. Leer `CLAUDE.md` (estructura, decisiones y modelo de datos de la comunidad).
2. Para probar lo actual: abrir `index.html` con doble clic → **Comunidad**.
3. Elegir la fase a atacar. Recomendación: **Fase 1** si se quiere avanzar rápido
   y visible; **Fase 2** si el objetivo real es que la gente comparta entre sí.
