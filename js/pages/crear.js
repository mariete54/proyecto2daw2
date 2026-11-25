/* =========================================================
   BARBERFLOW — pages/crear.js (Nueva reserva)
   · Servicios, barberos, días y horas se generan desde mockData
   · Las horas ocupadas/pasadas se deshabilitan dinámicamente
   · Validación de la fecha manual y de la hora
   · Modal de confirmación antes de guardar
   ========================================================= */
(function () {
  'use strict';

  const { DB, fecha, el, precio } = BF;
  const { reglas } = Validator;
  const $ = (sel) => document.querySelector(sel);
  const form = $('#reservaForm');
  const inputOtraFecha = form.elements.otraFecha;

  const DIAS_RAPIDOS = 5;
  const MAX_DIAS = 60;
  const OPC_FECHA = { noPasada: true, sinDomingos: true, maxDias: MAX_DIAS };
  const reglaFecha = reglas.fecha(OPC_FECHA);

  /* ---------- Helpers de lectura ---------- */
  const valorRadio = (name) => {
    const r = form.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : '';
  };
  const servicioSel = () => BF.getServicio(valorRadio('servicio'));
  const barberoSel = () => BF.getBarbero(valorRadio('barbero'));
  /** Fecha elegida: un día rápido o la fecha manual (solo si es válida). */
  function fechaSel() {
    const rapida = valorRadio('fecha');
    if (rapida) return rapida;
    const v = inputOtraFecha.value;
    return v && reglaFecha(v, inputOtraFecha) === '' ? v : '';
  }

  /* ---------- Renderizado de opciones ---------- */
  function opcion({ name, value, checked = false, disabled = false, clase, etiqueta, contenido }) {
    const input = el('input', { type: 'radio', name, value, class: 'sr-only', checked, disabled, 'aria-label': etiqueta });
    const clases = [clase, checked && 'is-selected', disabled && 'is-disabled'].filter(Boolean).join(' ');
    return el('label', { class: clases }, input, ...contenido);
  }

  function renderServicios() {
    $('#listaServicios').replaceChildren(...DB.servicios.map((s, i) => opcion({
      name: 'servicio', value: s.id, checked: i === 0, clase: 'service-option',
      contenido: [
        el('span', { class: 'icon-bubble', 'aria-hidden': 'true', text: s.icono }),
        el('span', { class: 'service-option__body' }, el('strong', { text: s.nombre }), el('small', { text: `${s.duracion} min · ${s.descripcion}` })),
        el('span', { class: 'service-option__price', text: precio(s.precio) }),
        el('span', { class: 'selection-dot', 'aria-hidden': 'true', text: '✓' })
      ]
    })));
  }

  function renderBarberos() {
    $('#listaBarberos').replaceChildren(...DB.barberos.map((b, i) => opcion({
      name: 'barbero', value: b.id, checked: i === 0, clase: 'barber-option',
      contenido: [el('strong', { text: b.nombre }), el('small', { text: b.especialidad })]
    })));
  }

  function proximosDias(n) {
    const dias = [];
    let iso = fecha.hoyISO();
    while (dias.length < n) {
      iso = fecha.sumarDias(iso, 1);
      if (fecha.parseISO(iso).getDay() !== 0) dias.push(iso); // sin domingos
    }
    return dias;
  }

  function renderFechas() {
    $('#listaFechas').replaceChildren(...proximosDias(DIAS_RAPIDOS).map((iso, i) => opcion({
      name: 'fecha', value: iso, checked: i === 0, clase: 'date-option', etiqueta: fecha.larga(iso),
      contenido: [el('span', { text: fecha.diaSemana(iso), 'aria-hidden': 'true' }), el('strong', { text: fecha.dia(iso), 'aria-hidden': 'true' })]
    })));
  }

  function horaNoDisponible(iso, hora, barberoId) {
    if (!iso) return false;
    if (fecha.conHora(iso, hora) <= new Date()) return true; // ya ha pasado (si la fecha es hoy)
    return BF.huecoOcupado(iso, hora, barberoId);
  }

  function renderHoras() {
    const iso = fechaSel();
    const barbero = barberoSel();
    const anterior = valorRadio('hora');
    $('#listaHoras').replaceChildren(...DB.horarios.map((h) => {
      const disabled = horaNoDisponible(iso, h, barbero && barbero.id);
      return opcion({
        name: 'hora', value: h, disabled, checked: !disabled && h === anterior, clase: 'time-option',
        etiqueta: disabled ? `${h} (no disponible)` : h,
        contenido: [h]
      });
    }));
  }

  /* ---------- Resumen lateral ---------- */
  function actualizarResumen() {
    const s = servicioSel();
    const b = barberoSel();
    const iso = fechaSel();
    const h = valorRadio('hora');
    $('#summaryTitle').textContent = s ? s.nombre : '—';
    $('#summarySubtitle').textContent = s && b ? `${s.duracion} min · Con ${b.nombre}` : '—';
    $('#summaryPrecio').textContent = s ? precio(s.precio) : '—';
    $('#summaryFecha').textContent = iso ? fecha.larga(iso) : '—';
    $('#summaryHora').textContent = h ? `${h} h` : '—';
  }

  /** Marca visualmente la opción elegida de cada grupo de radios. */
  function sincronizarSeleccion(name) {
    form.querySelectorAll(`input[name="${name}"]`).forEach((r) => r.closest('label').classList.toggle('is-selected', r.checked));
  }

  /* ---------- Eventos (registrados ANTES que el validador para que este lea el estado ya actualizado) ---------- */
  form.addEventListener('change', (e) => {
    const { name } = e.target;
    if (name === 'fecha') inputOtraFecha.value = ''; // un día rápido sustituye a la fecha manual
    if (['servicio', 'barbero', 'fecha', 'hora'].includes(name)) sincronizarSeleccion(name);
    if (['barbero', 'fecha'].includes(name)) renderHoras();
    actualizarResumen();
  });

  inputOtraFecha.addEventListener('input', () => {
    if (inputOtraFecha.value) {
      form.querySelectorAll('input[name="fecha"]').forEach((r) => { r.checked = false; });
      sincronizarSeleccion('fecha');
    }
    renderHoras();
    actualizarResumen();
  });

  /* ---------- Validación ---------- */
  inputOtraFecha.min = fecha.hoyISO();
  inputOtraFecha.max = fecha.sumarDias(fecha.hoyISO(), MAX_DIAS);

  Validator.crear(form, {
    otraFecha: [
      reglaFecha,
      (v) => (!valorRadio('fecha') && !v ? 'Elige uno de los días o indica otra fecha.' : '')
    ],
    hora: {
      tipo: 'radio',
      contenedor: $('#campoHora'),
      reglas: [
        reglas.requerido('Elige una hora disponible.'),
        (v) => (fechaSel() && BF.huecoOcupado(fechaSel(), v, barberoSel().id) ? 'Esa hora ya está ocupada. Elige otra.' : '')
      ]
    }
  }, {
    onSubmit: confirmarReserva,
    onInvalid: () => BF.toast('Revisa los pasos marcados en rojo')
  });

  async function confirmarReserva() {
    const s = servicioSel();
    const b = barberoSel();
    const iso = fechaSel();
    const h = valorRadio('hora');

    const fila = (dt, dd) => [el('dt', { text: dt }), el('dd', { text: dd })];
    const resumen = el('div', {},
      el('p', { text: 'Revisa los datos antes de confirmar:' }),
      el('dl', { class: 'resumen-lista' },
        fila('Servicio', s.nombre), fila('Barbero', b.nombre), fila('Fecha', fecha.larga(iso)),
        fila('Hora', `${h} h`), fila('Duración', `${s.duracion} min`), fila('Total', precio(s.precio))
      )
    );

    const ok = await BF.confirmar({
      titulo: '¿Confirmamos tu cita?',
      mensaje: resumen,
      textoOk: 'Confirmar reserva',
      textoCancelar: 'Seguir editando',
      icono: '✂'
    });
    if (!ok) return;

    const cita = BF.crearCita({ servicioId: s.id, barberoId: b.id, fecha: iso, hora: h });
    window.location.href = `detalle.html?id=${cita.id}`;
  }

  /* ---------- Inicio ---------- */
  renderServicios();
  renderBarberos();
  renderFechas();
  renderHoras();
  actualizarResumen();
})();
