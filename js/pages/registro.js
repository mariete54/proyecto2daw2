/* =========================================================
   BARBERFLOW — pages/registro.js
   Validación en tiempo real + medidor de seguridad de contraseña
   ========================================================= */
(function () {
  'use strict';

  const { reglas } = Validator;
  const form = document.getElementById('registroForm');
  const pass = form.elements.password;

  // El selector de fecha no deja elegir días futuros
  form.elements.nacimiento.max = BF.fecha.hoyISO();

  /* ---------- Medidor de seguridad ---------- */
  const NIVELES = [
    { texto: '—', color: 'transparent' },
    { texto: 'Débil', color: 'var(--danger)' },
    { texto: 'Aceptable', color: 'var(--gold)' },
    { texto: 'Buena', color: 'var(--success)' },
    { texto: 'Muy buena', color: 'var(--success)' }
  ];
  const barra = document.getElementById('fuerzaBarra');
  const etiqueta = document.getElementById('password-r-fuerza');

  function puntuar(v) {
    if (!v) return 0;
    let p = 1;
    if (v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v)) p++;
    if (v.length >= 12) p++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v) && /[^a-z0-9]/i.test(v)) p++;
    return Math.min(p, 4);
  }

  pass.addEventListener('input', () => {
    const n = puntuar(pass.value);
    barra.style.width = `${n * 25}%`;
    barra.style.background = NIVELES[n].color;
    etiqueta.textContent = `Seguridad: ${NIVELES[n].texto}`;
  });

  /* ---------- Validación ---------- */
  Validator.crear(form, {
    nombre: [
      reglas.requerido('¿Cómo te llamas?'),
      reglas.soloLetras(),
      reglas.nombreCompleto(),
      reglas.maxLongitud(60)
    ],
    email: [reglas.requerido('Necesitamos tu correo para enviarte las reservas.'), reglas.email()],
    nacimiento: [
      reglas.requerido('Indica tu fecha de nacimiento.'),
      reglas.fecha({ noFutura: true, edadMinima: 14 })
    ],
    password: [reglas.requerido('Crea una contraseña.'), reglas.password()],
    password2: [reglas.requerido('Repite la contraseña.'), reglas.coincide(() => pass.value)],
    terminos: [reglas.marcado('Debes aceptar los términos para crear la cuenta.')]
  }, {
    async onSubmit(datos) {
      const [nombre, ...apellidos] = datos.nombre.split(/\s+/);
      BF.setUsuario({
        nombre,
        apellidos: apellidos.join(' '),
        email: datos.email,
        nacimiento: datos.nacimiento,
        clienteDesde: BF.fecha.hoyISO()
      });
      await BF.aviso({
        titulo: `¡Bienvenido, ${nombre}!`,
        mensaje: 'Tu cuenta se ha creado correctamente. Ya puedes reservar tu primera cita.',
        textoOk: 'Ir a mi espacio',
        icono: '✓'
      });
      window.location.href = 'index.html';
    }
  });
})();
