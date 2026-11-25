/* =========================================================
   BARBERFLOW — pages/detalle.js
   Muestra la cita indicada en ?id=… (o la última creada,
   o la próxima) y permite cancelarla con un modal.
   ========================================================= */
(function () {
  'use strict';

  const { fecha, precio } = BF;
  const $ = (sel) => document.querySelector(sel);

  const TEXTOS = {
    confirmada: { estado: 'Reserva confirmada', saludo: 'Todo listo', icono: '✓', texto: 'Te esperamos. Hemos enviado todos los detalles a tu correo.' },
    completada: { estado: 'Cita completada', saludo: 'Gracias por venir', icono: '★', texto: 'Esperamos que te guste el resultado. ¿Repetimos pronto?' },
    cancelada: { estado: 'Cita cancelada', saludo: 'Cita anulada', icono: '✕', texto: 'Esta cita se canceló y el hueco quedó libre.' }
  };

  function buscarCita() {
    const id = Number(new URLSearchParams(window.location.search).get('id')) || BF.getUltimaCitaId();
    const cita = id ? BF.getCita(id) : null;
    return cita ? BF.enriquecer(cita) : BF.proximaCita();
  }

  function render() {
    const c = buscarCita();
    $('#detailName').textContent = BF.getUsuario().nombre;
    const cancelar = $('#cancelarBtn');

    if (!c) {
      $('#detailEstado').textContent = 'Sin reservas';
      $('#detailIcon').textContent = '✦';
      $('#detailSaludo').textContent = 'Aún nada por aquí';
      $('#detailTexto').textContent = 'No tienes ninguna cita pendiente. ¡Reserva la primera!';
      $('#detailTitleH2').textContent = 'Sin citas pendientes';
      $('#detailCode').textContent = '—';
      cancelar.hidden = true;
      return;
    }

    const t = TEXTOS[c.estadoReal];
    document.title = `${c.servicio.nombre} · BarberFlow`;
    $('#detailEstado').textContent = t.estado;
    $('#detailSaludo').textContent = t.saludo;
    $('#detailIcon').textContent = t.icono;
    $('#detailTexto').textContent = t.texto;
    $('#detailCode').textContent = c.codigo;
    $('#detailTitleH2').textContent = c.servicio.nombre;
    $('#detailFecha').textContent = fecha.larga(c.fecha);
    $('#detailHora').textContent = `${c.hora} h · ${c.servicio.duracion} min`;
    $('#detailServicio').textContent = `${c.servicio.nombre} (${precio(c.servicio.precio)})`;
    $('#detailBarbero').textContent = `${c.barbero.nombre} · ${c.barbero.especialidad}`;
    document.querySelector('.detail-card').classList.toggle('detail-card--cancelada', c.estadoReal === 'cancelada');

    cancelar.hidden = c.estadoReal !== 'confirmada';
    cancelar.onclick = async () => {
      if (await BF.confirmarCancelacion(c.id)) render();
    };
  }

  render();
})();
