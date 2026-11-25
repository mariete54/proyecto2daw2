/* =========================================================
   BARBERFLOW — pages/index.js (Dashboard)
   · Saludo y fecha dinámicos
   · Tarjeta "Tu próxima cita"
   · Renderizado de tarjetas de citas desde mockData/localStorage
   · Buscador + filtros por estado en tiempo real
   ========================================================= */
(function () {
  'use strict';

  const { fecha } = BF;
  const $ = (sel) => document.querySelector(sel);

  /* ---------- Cabecera ---------- */
  const hora = new Date().getHours();
  const saludo = hora < 6 ? 'Buenas noches' : hora < 13 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches';
  $('#saludo').textContent = saludo;
  $('#userNameDisplay').textContent = `${BF.getUsuario().nombre}.`;
  $('#fechaHoy').textContent = fecha.larga(fecha.hoyISO());
  const plan = BF.getPlan(BF.getPlanId());
  $('#planActual').textContent = `Plan ${plan.nombre} · ${BF.precio(plan.precio)}/mes`;

  /* ---------- Tarjeta hero ---------- */
  function pintarHero() {
    const proxima = BF.proximaCita();
    const enlace = $('#heroDetalle');
    if (proxima) {
      $('#heroTitle').textContent = proxima.servicio.nombre;
      $('#heroFecha').textContent = fecha.larga(proxima.fecha);
      $('#heroHora').textContent = `${proxima.hora} h · con ${proxima.barbero.nombre}`;
      $('#heroMonogram').textContent = fecha.dia(proxima.fecha);
      enlace.href = `detalle.html?id=${proxima.id}`;
      enlace.hidden = false;
    } else {
      $('#heroTitle').textContent = 'Sin citas próximas';
      $('#heroFecha').textContent = '-';
      $('#heroHora').textContent = '-';
      $('#heroMonogram').textContent = '✦';
      enlace.hidden = true;
    }
  }

  /* ---------- Dashboard: búsqueda + filtros ---------- */
  const contenedor = $('#dashboardCitas');
  const buscador = $('#buscarCitas');
  const contador = $('#contadorCitas');
  const vacio = $('#citasVacias');
  const chips = document.querySelectorAll('.chip[data-filtro]');
  const estado = { texto: '', filtro: 'todas' };

  // Quita tildes y pasa a minúsculas: "Lucía" coincide con "lucia"
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const textoBuscable = (c) =>
    normalizar(`${c.servicio.nombre} ${c.barbero.nombre} ${fecha.larga(c.fecha)} ${c.hora} ${c.codigo}`);

  function render() {
    const citas = BF.ordenarCitas(BF.getCitas().map(BF.enriquecer));
    const consulta = normalizar(estado.texto.trim());
    const coincideTexto = (c) => !consulta || textoBuscable(c).includes(consulta);

    const visibles = citas.filter((c) =>
      (estado.filtro === 'todas' || c.estadoReal === estado.filtro) && coincideTexto(c));

    // El contador de cada chip refleja cuántas coinciden con el texto buscado
    chips.forEach((chip) => {
      const f = chip.dataset.filtro;
      const n = citas.filter((c) => (f === 'todas' || c.estadoReal === f) && coincideTexto(c)).length;
      chip.querySelector('.chip__count').textContent = n;
    });

    contenedor.replaceChildren(...visibles.map(BF.crearTarjetaCita));
    contador.textContent = `Mostrando ${visibles.length} de ${citas.length} citas`;
    vacio.hidden = visibles.length > 0;
  }

  buscador.addEventListener('input', () => {
    estado.texto = buscador.value;
    render();
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      estado.filtro = chip.dataset.filtro;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      render();
    });
  });

  $('#limpiarFiltros').addEventListener('click', () => {
    buscador.value = '';
    estado.texto = '';
    chips[0].click();
    buscador.focus();
  });

  // Delegación de eventos: un único listener para todos los botones "Cancelar"
  contenedor.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="cancelar-cita"]');
    if (!btn) return;
    if (await BF.confirmarCancelacion(Number(btn.dataset.id))) {
      render();
      pintarHero();
    }
  });

  pintarHero();
  render();
})();
