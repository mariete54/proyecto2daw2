/* =========================================================
   BARBERFLOW — pages/mis-citas.js
   Lista de citas separada en "Próximas" e "Historial".
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  function pintarLista(citas, lista, vacio, contador) {
    lista.replaceChildren(...citas.map(BF.crearTarjetaCita));
    vacio.hidden = citas.length > 0;
    contador.textContent = `(${citas.length})`;
  }

  function render() {
    const citas = BF.ordenarCitas(BF.getCitas().map(BF.enriquecer));
    pintarLista(citas.filter((c) => c.estadoReal === 'confirmada'), $('#listaProximas'), $('#vacioProximas'), $('#numProximas'));
    pintarLista(citas.filter((c) => c.estadoReal !== 'confirmada'), $('#listaHistorial'), $('#vacioHistorial'), $('#numHistorial'));
  }

  // Delegación: un listener en <main> cubre las dos listas
  $('.app-main').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="cancelar-cita"]');
    if (btn && (await BF.confirmarCancelacion(Number(btn.dataset.id)))) render();
  });

  render();
})();
