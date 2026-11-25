/* =========================================================
   BARBERFLOW — pages/login.js
   ========================================================= */
(function () {
  'use strict';

  const { reglas } = Validator;
  const form = document.getElementById('loginForm');

  // Si el usuario ya se registró en este navegador, rellenamos su correo
  const guardado = BF.storage.get(BF.KEYS.usuario, {});
  if (guardado.email) form.elements.email.value = guardado.email;

  Validator.crear(form, {
    email: [reglas.requerido('Introduce tu correo electrónico.'), reglas.email()],
    password: [
      reglas.requerido('Introduce tu contraseña.'),
      reglas.minLongitud(6, 'La contraseña tiene al menos 6 caracteres.')
    ]
  }, {
    onSubmit(datos) {
      BF.setUsuario({ email: datos.email });
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Entrando…';
      window.location.href = 'index.html';
    }
  });
})();
