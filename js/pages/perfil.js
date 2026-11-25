/* =========================================================
   BARBERFLOW — pages/perfil.js
   Modo lectura / edición del perfil con validación en vivo.
   ========================================================= */
(function () {
  'use strict';

  const { reglas } = Validator;
  const $ = (sel) => document.querySelector(sel);
  const form = $('#profileForm');
  const editBtn = $('#editBtn');
  const descartarBtn = $('#descartarBtn');
  const inputs = form.querySelectorAll('input');
  let editando = false;

  function pintar() {
    const u = BF.getUsuario();
    form.elements.nombre.value = u.nombre;
    form.elements.apellidos.value = u.apellidos;
    form.elements.email.value = u.email;
    form.elements.telefono.value = u.telefono;
    $('#profileNameTitle').textContent = `${u.nombre} ${u.apellidos}`.trim();
    $('#avatarInitials').textContent = ((u.nombre[0] || '') + (u.apellidos[0] || '')).toUpperCase();
    $('#clienteDesde').textContent = `Cliente desde ${BF.fecha.mesAnio(u.clienteDesde)}`;
    $('#planPerfil').textContent = BF.getPlan(BF.getPlanId()).nombre;
  }

  function setEdicion(activo) {
    editando = activo;
    inputs.forEach((i) => { i.disabled = !activo; });
    editBtn.textContent = activo ? 'Guardar cambios' : 'Editar datos';
    editBtn.classList.toggle('is-active', activo);
    descartarBtn.hidden = !activo;
    if (activo) form.elements.nombre.focus();
  }

  const validador = Validator.crear(form, {
    nombre: [reglas.requerido('Indica tu nombre.'), reglas.soloLetras(), reglas.minLongitud(2), reglas.maxLongitud(30)],
    apellidos: [reglas.requerido('Indica al menos un apellido.'), reglas.soloLetras(), reglas.maxLongitud(50)],
    email: [reglas.requerido('El correo es obligatorio.'), reglas.email()],
    telefono: [reglas.requerido('Indica un teléfono de contacto.'), reglas.telefono()]
  }, {
    onSubmit(datos) {
      BF.setUsuario(datos);
      validador.reset();
      setEdicion(false);
      pintar();
      BF.toast('¡Datos guardados correctamente!');
    },
    onInvalid: () => BF.toast('Corrige los campos marcados antes de guardar')
  });

  // Mismo botón: primero activa la edición, después envía el formulario (que valida)
  editBtn.addEventListener('click', () => {
    if (editando) form.requestSubmit();
    else setEdicion(true);
  });

  descartarBtn.addEventListener('click', () => {
    pintar();
    validador.reset();
    setEdicion(false);
    BF.toast('Cambios descartados');
  });

  pintar();
})();
