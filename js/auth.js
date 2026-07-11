/* ============================================================
   auth.js — Registro e inicio de sesión BÁSICO y LOCAL.

   ⚠️ IMPORTANTE (seguridad): esto es un prototipo local. Los
   usuarios y una huella de la contraseña se guardan en el
   localStorage del navegador. NO es seguridad real:
     - cualquiera con acceso al equipo podría inspeccionarlos;
     - la "huella" (hash) es solo una ofuscación simple, no un
       algoritmo criptográfico.
   No usar con contraseñas reales. La API está pensada para que,
   más adelante, se pueda reemplazar el almacenamiento local por
   un servidor sin tocar el resto del sitio (ver window.Auth).

   API pública (window.Auth):
     signup(usuario, pass)  -> { ok, error }
     login(usuario, pass)   -> { ok, error }
     logout()
     current()              -> string | null  (usuario en sesión)
     onChange(fn)           -> suscribe a cambios de sesión
   ============================================================ */
(function () {
  "use strict";

  var K_USERS = "comunidad-usuarios";   // [{ usuario, hash, creado }]
  var K_SESSION = "comunidad-sesion";   // usuario actual (string)

  var listeners = [];

  /* ---------- Almacenamiento (fácil de cambiar por un servidor) ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------- "Hash" de contraseña (ofuscación, NO criptográfico) ---------- */
  // djb2 con una sal por usuario. Suficiente para no guardar la
  // contraseña en texto plano en un prototipo local.
  function hash(usuario, pass) {
    var s = "sal:" + usuario.toLowerCase() + ":" + pass;
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; // h * 33 + c
    }
    return h.toString(16);
  }

  function findUser(usuario) {
    var users = read(K_USERS, []);
    var u = usuario.toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].usuario.toLowerCase() === u) return users[i];
    }
    return null;
  }

  function notify() {
    var cur = current();
    listeners.forEach(function (fn) { try { fn(cur); } catch (e) {} });
  }

  /* ---------- API ---------- */
  function signup(usuario, pass) {
    usuario = (usuario || "").trim();
    pass = pass || "";
    if (usuario.length < 3) return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
    if (usuario.length > 20) return { ok: false, error: "El usuario no puede superar los 20 caracteres." };
    if (!/^[a-zA-Z0-9_.-]+$/.test(usuario)) return { ok: false, error: "Usa solo letras, números, punto, guion o guion bajo." };
    if (pass.length < 4) return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
    if (findUser(usuario)) return { ok: false, error: "Ese usuario ya existe. Prueba con otro o inicia sesión." };

    var users = read(K_USERS, []);
    users.push({ usuario: usuario, hash: hash(usuario, pass), creado: new Date().toISOString() });
    write(K_USERS, users);
    write(K_SESSION, usuario);
    notify();
    return { ok: true };
  }

  function login(usuario, pass) {
    usuario = (usuario || "").trim();
    pass = pass || "";
    var u = findUser(usuario);
    if (!u || u.hash !== hash(u.usuario, pass)) {
      return { ok: false, error: "Usuario o contraseña incorrectos." };
    }
    write(K_SESSION, u.usuario);
    notify();
    return { ok: true };
  }

  function logout() {
    try { localStorage.removeItem(K_SESSION); } catch (e) {}
    notify();
  }

  function current() {
    var s = read(K_SESSION, null);
    // Verifica que el usuario en sesión todavía exista
    return s && findUser(s) ? s : null;
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  window.Auth = {
    signup: signup,
    login: login,
    logout: logout,
    current: current,
    onChange: onChange,
  };
})();
