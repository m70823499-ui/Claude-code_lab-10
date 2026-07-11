# 📶 Monitor de Planes Móviles — Tigo vs Claro (Colombia)

Página web para **monitorear y comparar los planes móviles pospago** de Tigo y
Claro en Colombia. Muestra de forma **gráfica y sencilla** precios, datos
incluidos y ofertas; una lista de **cosas a tener en cuenta**; y un
**recomendador** que sugiere el plan ideal según tus respuestas.

> **Regla clave:** no se inventa información. Cada plan lleva su **fuente y
> fecha** visibles. Los datos se recopilan manualmente de fuentes de terceros
> (Selectra Colombia, celulares.com) porque los sitios oficiales bloquean el
> acceso automatizado.

---

## 🚀 Cómo verlo

Es un sitio **estático, sin instalación ni build**. Dos formas:

1. **La más fácil:** haz **doble clic en `index.html`** y se abre en tu
   navegador. (Funciona directo porque los datos viven en `js/data.js`, no se
   cargan por `fetch`.)

2. **Con un servidor local** (opcional, recomendado para desarrollo):
   ```bash
   python3 -m http.server 8000
   # luego abre http://localhost:8000
   ```

---

## 🌐 Publicarlo gratis en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. En el repo: **Settings → Pages**.
3. En **Source** elige la rama (`main` o tu rama de trabajo) y la carpeta
   `/root`. Guarda.
4. En un minuto quedará disponible en
   `https://<tu-usuario>.github.io/<tu-repo>/`.

No hay dependencias externas ni CDNs, así que funciona también sin conexión.

---

## 🗂️ Estructura

```
index.html            Página única con todas las secciones
css/styles.css        Estilos, responsive y tema claro/oscuro
js/data.js            ← DATOS: planes reales + fuentes + fecha
js/charts.js          Gráficos en SVG (precio, GB, precio/GB, dispersión)
js/comparison.js      Matriz comparativa + KPIs + consideraciones
js/recommender.js     Cuestionario + motor de recomendación
js/app.js             Orquestador (tema, fecha, arranque)
```

---

## 🔄 Cómo actualizar los datos

Toda la información editable está en **`js/data.js`**.

1. Consulta los precios y beneficios vigentes de cada operador (sitio oficial o
   agregadores como Selectra Colombia).
2. Edita los planes en `js/data.js`: `precio`, `datosGB`, `extras`, `oferta`, etc.
3. Actualiza la `fecha` de cada `fuente` que hayas verificado y el campo global
   `actualizado`.
4. Guarda y recarga la página.

### Caso "página en mantenimiento"

Si al actualizar una fuente **no está disponible**, **conserva los valores
anteriores** de ese plan y **no cambies** su `fecha`. Así siempre se muestra la
última versión conocida y verificable — nunca un dato inventado. El historial
queda respaldado por el control de versiones (git).

---

## ⚠️ Aviso

Los precios y beneficios son **referenciales** y pueden cambiar. Verifica
siempre en el sitio oficial del operador antes de contratar. Este proyecto no
está afiliado a Tigo ni a Claro.
