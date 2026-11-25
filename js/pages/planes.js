/* =========================================================
   BARBERFLOW — pages/planes.js
   Tarjetas de planes generadas con createElement desde mockData
   y cambio de plan con modal de confirmación.
   ========================================================= */
(function () {
  'use strict';

  const { DB, el, precio } = BF;
  const lista = document.getElementById('listaPlanes');

  function crearTarjetaPlan(plan, actual) {
    const esActual = plan.id === actual;
    return el('article', { class: `plan-card${esActual ? ' is-current' : ''}`, 'aria-labelledby': `plan-${plan.id}` },
      esActual ? el('span', { class: 'plan-card__badge', text: 'Plan actual' }) : null,
      el('span', { class: 'icon-bubble plan-card__icon', 'aria-hidden': 'true', text: plan.icono }),
      el('h2', { class: 'plan-card__name', id: `plan-${plan.id}`, text: plan.nombre }),
      el('p', { class: 'plan-card__desc', text: plan.descripcion }),
      el('p', { class: 'plan-card__price' },
        el('span', { class: 'plan-card__amount', text: precio(plan.precio).replace(' ', '') }),
        el('span', { class: 'plan-card__period', text: '/ mes' })
      ),
      el('ul', { class: 'plan-card__features' }, plan.ventajas.map((v) => el('li', { text: v }))),
      el('button', {
        type: 'button',
        class: 'btn plan-btn',
        dataset: { plan: plan.id },
        'aria-pressed': String(esActual)
      }, esActual ? 'Plan seleccionado ✓' : 'Elegir este plan')
    );
  }

  function render() {
    const actual = BF.getPlanId();
    lista.replaceChildren(...DB.planes.map((p) => crearTarjetaPlan(p, actual)));
  }

  lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('.plan-btn');
    if (!btn) return;
    const nuevo = BF.getPlan(btn.dataset.plan);
    const actual = BF.getPlan(BF.getPlanId());

    if (nuevo.id === actual.id) {
      BF.toast(`Ya tienes el plan ${nuevo.nombre} activo`);
      return;
    }

    const sube = nuevo.precio > actual.precio;
    const ok = await BF.confirmar({
      titulo: `¿Cambiar al plan ${nuevo.nombre}?`,
      mensaje: `Pasarás de ${precio(actual.precio)}/mes a ${precio(nuevo.precio)}/mes. ${sube ? 'Las nuevas ventajas se activan hoy mismo.' : 'El cambio se aplicará en tu próxima renovación.'}`,
      textoOk: `Cambiar a ${nuevo.nombre}`,
      textoCancelar: `Seguir con ${actual.nombre}`,
      icono: nuevo.icono
    });
    if (!ok) return;

    BF.setPlanId(nuevo.id);
    render();
    BF.toast(`¡Te has cambiado al plan ${nuevo.nombre}!`);
  });

  document.getElementById('contactoBtn').addEventListener('click', () => {
    BF.aviso({
      titulo: 'Hablemos',
      mensaje: 'Llámanos al 910 234 567 o escríbenos a hola@barberflow.com. Te respondemos en menos de 24 h.',
      textoOk: 'Entendido',
      icono: '☎'
    });
  });

  render();
})();
