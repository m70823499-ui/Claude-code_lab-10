/*
 * Datos curados de planes móviles pospago — Tigo y Claro (Colombia).
 *
 * REGLA "no inventar": cada plan lleva su `fuente` (nombre, url, fecha).
 * Los valores se recopilaron manualmente de fuentes de terceros (Selectra
 * Colombia y celulares.com), porque los sitios oficiales bloquean el acceso
 * automatizado. Al actualizar: re-investigar, cambiar los valores y la fecha
 * `actualizado`. Si una fuente está en mantenimiento, se conservan los valores
 * previos (control de versiones en git) — no se inventa nada.
 *
 * moneda: COP (pesos colombianos). precio = valor mensual de lista.
 */
window.PLANES = {
  actualizado: "2026-07-11",
  moneda: "COP",
  disclaimer:
    "Precios y beneficios referenciales, recopilados de fuentes de terceros " +
    "(Selectra Colombia, celulares.com) el 11/07/2026. Verifica siempre en el " +
    "sitio oficial del operador antes de contratar. Si una fuente estuviera en " +
    "mantenimiento, se conserva la última versión conocida de los datos.",

  operadores: [
    {
      id: "tigo",
      nombre: "Tigo",
      color: "#0057B8",      // azul — validado (light)
      colorDark: "#4C97F0",  // azul — validado (dark)
      planes: [
        {
          id: "tigo-60",
          nombre: "Pospago 60 GB",
          precio: 53900,
          precioNormal: null,
          datosGB: 60,
          ilimitado: false,
          datosCompartir: null,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "4G / 5G",
          red5g: true,
          streaming: null,
          roaming: "EE. UU., Canadá y Puerto Rico (llamadas)",
          extras: [
            "Llamadas ilimitadas a EE. UU., Canadá y Puerto Rico",
            "Redes sociales ilimitadas (WhatsApp, Facebook, Instagram)",
          ],
          oferta: {
            activa: true,
            descripcion: "30% de descuento los primeros 3 meses",
            vigencia: "Promoción vigente 2026",
          },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/tigo/pospago",
            fecha: "2026-07-11",
          },
        },
        {
          id: "tigo-ilimitado",
          nombre: "GB Ilimitadas + Redes",
          precio: 109900,
          precioNormal: null,
          datosGB: null,
          ilimitado: true,
          datosCompartir: 80,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "4G / 5G",
          red5g: true,
          streaming: "Amazon Prime Video",
          roaming: "25 GB + 100 min internacionales",
          extras: [
            "Datos ilimitados (hasta 80 GB para compartir / hotspot)",
            "Amazon Prime Video incluido",
            "Roaming: 25 GB + 100 minutos internacionales",
            "Llamadas ilimitadas a EE. UU., Canadá y Puerto Rico",
          ],
          oferta: {
            activa: true,
            descripcion: "Promoción 'Tigo Ilimitado' desde $69.900 en canales seleccionados",
            vigencia: "Sujeta a disponibilidad",
          },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/tigo/pospago",
            fecha: "2026-07-11",
          },
        },
      ],
    },

    {
      id: "claro",
      nombre: "Claro",
      color: "#E1251B",      // rojo — validado (light)
      colorDark: "#EF5350",  // rojo — validado (dark)
      planes: [
        {
          id: "claro-65",
          nombre: "Móvil 65 GB",
          precio: 53900,
          precioNormal: null,
          datosGB: 65,
          ilimitado: false,
          datosCompartir: null,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "4G LTE",
          red5g: false,
          streaming: "Claro Video (12 meses)",
          roaming: "Perú, Bolivia y Ecuador",
          extras: [
            "Claro Video incluido 12 meses",
            "Redes sociales gratis tras agotar los GB",
            "Roaming gratis en Perú, Bolivia y Ecuador",
          ],
          oferta: { activa: false, descripcion: null, vigencia: null },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/claro/pospago",
            fecha: "2026-07-11",
          },
        },
        {
          id: "claro-100",
          nombre: "Móvil 100 GB",
          precio: 65900,
          precioNormal: null,
          datosGB: 100,
          ilimitado: false,
          datosCompartir: null,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "5G",
          red5g: true,
          streaming: "Claro Video (12 meses) + Max",
          roaming: "Perú, Bolivia y Ecuador",
          extras: [
            "Red 5G",
            "Claro Video 12 meses + Max",
            "Roaming en Perú, Bolivia y Ecuador",
          ],
          oferta: { activa: false, descripcion: null, vigencia: null },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/claro/pospago",
            fecha: "2026-07-11",
          },
        },
        {
          id: "claro-130",
          nombre: "Móvil 130 GB",
          precio: 75900,
          precioNormal: null,
          datosGB: 130,
          ilimitado: false,
          datosCompartir: null,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "5G",
          red5g: true,
          streaming: "Claro Video (12 meses) + Max",
          roaming: "Perú, Bolivia y Ecuador",
          extras: [
            "Red 5G",
            "Claro Video 12 meses + Max",
            "Roaming en Perú, Bolivia y Ecuador",
          ],
          oferta: { activa: false, descripcion: null, vigencia: null },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/claro/pospago",
            fecha: "2026-07-11",
          },
        },
        {
          id: "claro-libre",
          nombre: "Libre (Ilimitado)",
          precio: 99900,
          precioNormal: null,
          datosGB: null,
          ilimitado: true,
          datosCompartir: 130,
          minutos: "ilimitados",
          sms: "ilimitados",
          red: "5G",
          red5g: true,
          streaming: "Claro Video (12 meses) + Max",
          roaming: "Internacional (países seleccionados)",
          extras: [
            "Datos ilimitados",
            "Red 5G",
            "Claro Video 12 meses + Max",
            "Roaming internacional en países seleccionados",
          ],
          oferta: { activa: false, descripcion: null, vigencia: null },
          fuente: {
            nombre: "Selectra Colombia",
            url: "https://selectra.com.co/empresas/claro/pospago",
            fecha: "2026-07-11",
          },
        },
      ],
    },
  ],

  // "Cosas a tener en cuenta" para tomar una decisión.
  consideraciones: [
    {
      icono: "📅",
      titulo: "Permanencia",
      texto:
        "Los planes pospago actuales suelen renovarse mes a mes, normalmente sin " +
        "cláusula de permanencia. Confírmalo antes de firmar, sobre todo si te " +
        "financian un equipo.",
    },
    {
      icono: "🏷️",
      titulo: "La letra pequeña de las ofertas",
      texto:
        "Los descuentos promocionales (ej. 30% los primeros 3 meses) suben al " +
        "precio de lista cuando termina la promoción. Calcula el costo real a 12 meses.",
    },
    {
      icono: "🐢",
      titulo: "Velocidad tras agotar datos",
      texto:
        "Al superar tus GB la navegación puede reducir su velocidad. Algunos planes " +
        "mantienen redes sociales gratis aunque se acaben los datos.",
    },
    {
      icono: "📶",
      titulo: "Cobertura 5G",
      texto:
        "El 5G solo aplica en ciudades cubiertas y en los planes que lo incluyen. " +
        "El plan de entrada de Claro (65 GB) funciona sobre 4G LTE.",
    },
    {
      icono: "✈️",
      titulo: "Roaming internacional",
      texto:
        "Claro incluye roaming en Perú, Bolivia y Ecuador; Tigo enfoca EE. UU., " +
        "Canadá y Puerto Rico, con roaming ampliado en su plan ilimitado.",
    },
    {
      icono: "🎬",
      titulo: "Contenido de streaming incluido",
      texto:
        "Claro suma Claro Video / Max; Tigo incluye Amazon Prime Video en su plan " +
        "ilimitado. Vale más si aún no pagas ese servicio por tu cuenta.",
    },
    {
      icono: "🔗",
      titulo: "Datos para compartir (hotspot)",
      texto:
        "Los planes 'ilimitados' limitan el compartir/hotspot (ej. hasta 80 GB en " +
        "Tigo). El uso en el teléfono es ilimitado, pero compartir sí tiene tope.",
    },
  ],
};
