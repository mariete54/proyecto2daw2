/* =========================================================
   BARBERFLOW — app.js
   Núcleo compartido por todas las páginas:
   · Capa de datos (mockData + localStorage)
   · Utilidades de fecha y formato
   · Componentes de UI: toast, modal, menú hamburguesa,
     tarjeta de cita, mostrar/ocultar contraseña
   Expone todo en el objeto global `BF`.
   ========================================================= */
(function () {
  'use strict';

  const DB = window.MOCK_DATA;
  const KEYS = { usuario: 'bf_usuario', citas: 'bf_citas', plan: 'bf_plan', ultima: 'bf_ultimaCita' };

  /* ---------- localStorage seguro ---------- */
  const storage = {
    get(key, porDefecto = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? porDefecto : JSON.parse(raw);
      } catch (e) {
        return porDefecto; // JSON corrupto o storage bloqueado
      }
    },
    set(key, valor) {
      try { localStorage.setItem(key, JSON.stringify(valor)); } catch (e) { /* storage lleno o bloqueado */ }
    },
    limpiar() {
      Object.values(KEYS).forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) { /* nada que limpiar */ }
      });
    }
  };

  /* ---------- Fechas ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const formatear = (iso, opciones) => new Intl.DateTimeFormat('es-ES', opciones).format(parseISO(iso));

  const fecha = {
    toISO,
    parseISO,
    hoyISO: () => toISO(new Date()),
    sumarDias(iso, n) {
      const d = parseISO(iso);
      d.setDate(d.getDate() + n);
      return toISO(d);
    },
    /** "Viernes, 18 de abril" */
    larga: (iso) => capitalizar(formatear(iso, { weekday: 'long', day: 'numeric', month: 'long' })),
    /** "Vie" */
    diaSemana: (iso) => capitalizar(formatear(iso, { weekday: 'short' }).replace('.', '')),
    /** "abr" */
    mes: (iso) => formatear(iso, { month: 'short' }).replace('.', ''),
    dia: (iso) => parseISO(iso).getDate(),
    /** "marzo de 2024" */
    mesAnio: (iso) => formatear(iso, { month: 'long', year: 'numeric' }),
    conHora(iso, hora) {
      const d = parseISO(iso);
      const [h, m] = hora.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      return d;
    }
  };

  const precio = (n) => `${n} €`;

  /* ---------- Capa de datos ---------- */
  const getServicio = (id) => DB.servicios.find((s) => s.id === id) || null;
  const getBarbero = (id) => DB.barberos.find((b) => b.id === id) || null;
  const getPlan = (id) => DB.planes.find((p) => p.id === id) || null;

  function getUsuario() {
    return { ...DB.usuario, ...storage.get(KEYS.usuario, {}) };
  }
  function setUsuario(cambios) {
    storage.set(KEYS.usuario, { ...storage.get(KEYS.usuario, {}), ...cambios });
  }

  function getPlanId() {
    const id = storage.get(KEYS.plan, DB.usuario.plan);
    return getPlan(id) ? id : DB.usuario.plan;
  }
  const setPlanId = (id) => storage.set(KEYS.plan, id);

  /** La primera vez se "siembra" localStorage con las citas de mockData. */
  function getCitas() {
    let citas = storage.get(KEYS.citas);
    if (!Array.isArray(citas)) {
      citas = DB.citas.map((c) => ({ ...c }));
      storage.set(KEYS.citas, citas);
    }
    // Descarta registros incompletos o de versiones anteriores
    return citas.filter((c) => c && c.fecha && c.hora && getServicio(c.servicioId) && getBarbero(c.barberoId));
  }
  const guardarCitas = (citas) => storage.set(KEYS.citas, citas);
  const getCita = (id) => getCitas().find((c) => c.id === id) || null;

  function crearCita(datos) {
    const cita = { id: Date.now(), estado: 'confirmada', ...datos };
    const citas = getCitas();
    citas.push(cita);
    guardarCitas(citas);
    storage.set(KEYS.ultima, cita.id);
    return cita;
  }

  function cancelarCita(id) {
    const citas = getCitas();
    const cita = citas.find((c) => c.id === id);
    if (!cita) return null;
    cita.estado = 'cancelada';
    guardarCitas(citas);
    return cita;
  }

  /** confirmada | completada | cancelada (una cita confirmada cuya hora ya pasó cuenta como completada) */
  function estadoCita(cita) {
    if (cita.estado === 'cancelada') return 'cancelada';
    return fecha.conHora(cita.fecha, cita.hora) < new Date() ? 'completada' : 'confirmada';
  }

  /** Añade los objetos relacionados (servicio, barbero) y campos calculados. */
  function enriquecer(cita) {
    return {
      ...cita,
      servicio: getServicio(cita.servicioId),
      barbero: getBarbero(cita.barberoId),
      estadoReal: estadoCita(cita),
      codigo: 'BF-' + String(cita.id).slice(-4)
    };
  }

  const porFecha = (a, b) => fecha.conHora(a.fecha, a.hora) - fecha.conHora(b.fecha, b.hora);

  /** Próximas primero (de la más cercana a la más lejana) y después el historial (de la más reciente a la más antigua). */
  function ordenarCitas(citas) {
    const proximas = citas.filter((c) => c.estadoReal === 'confirmada').sort(porFecha);
    const resto = citas.filter((c) => c.estadoReal !== 'confirmada').sort((a, b) => porFecha(b, a));
    return [...proximas, ...resto];
  }

  function proximaCita() {
    const proximas = getCitas().filter((c) => estadoCita(c) === 'confirmada').sort(porFecha);
    return proximas.length ? enriquecer(proximas[0]) : null;
  }

  const getUltimaCitaId = () => storage.get(KEYS.ultima);

  function huecoOcupado(fechaISO, hora, barberoId) {
    return getCitas().some((c) => c.fecha === fechaISO && c.hora === hora && c.barberoId === barberoId && c.estado !== 'cancelada');
  }

  /* ---------- Helper para crear nodos del DOM ---------- */
  function el(tag, props = {}, ...hijos) {
    const nodo = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') nodo.className = v;
      else if (k === 'text') nodo.textContent = v;
      else if (k === 'dataset') Object.assign(nodo.dataset, v);
      else if (k === 'checked' || k === 'disabled') nodo[k] = Boolean(v);
      else nodo.setAttribute(k, v === true ? '' : v);
    });
    hijos.flat().forEach((h) => { if (h !== null && h !== undefined) nodo.append(h); });
    return nodo;
  }

  /* ---------- Toast (aviso flotante) ---------- */
  let toastTimer;
  function toast(mensaje) {
    document.querySelectorAll('.custom-toast').forEach((t) => t.remove());
    clearTimeout(toastTimer);
    const t = el('div', { class: 'custom-toast', role: 'status', text: mensaje });
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    toastTimer = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  /* ---------- Modal (<dialog> nativo) ---------- */
  let dialogo;
  function getDialogo() {
    if (dialogo) return dialogo;
    dialogo = el('dialog', { class: 'modal', 'aria-labelledby': 'modalTitulo', 'aria-describedby': 'modalCuerpo' },
      el('form', { method: 'dialog', class: 'modal__box' },
        el('span', { class: 'modal__icon', 'aria-hidden': 'true' }),
        el('h2', { class: 'modal__title', id: 'modalTitulo' }),
        el('div', { class: 'modal__body', id: 'modalCuerpo' }),
        el('div', { class: 'modal__actions' },
          el('button', { type: 'submit', value: 'cancel', class: 'btn btn--outline', 'data-modal': 'cancel' }),
          el('button', { type: 'submit', value: 'ok', class: 'btn btn--primary', 'data-modal': 'ok' })
        )
      )
    );
    // Clic fuera de la caja (en el backdrop) = cancelar
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close('cancel'); });
    document.body.append(dialogo);
    return dialogo;
  }

  /**
   * Abre un modal y devuelve una Promesa que se resuelve a true (Aceptar) o false (Cancelar / Esc / clic fuera).
   * @param {{titulo:string, mensaje:string|Node, textoOk?:string, textoCancelar?:string, soloAviso?:boolean, peligro?:boolean, icono?:string}} o
   */
  function abrirModal({ titulo, mensaje, textoOk = 'Aceptar', textoCancelar = 'Cancelar', soloAviso = false, peligro = false, icono = '✦' }) {
    const d = getDialogo();
    if (d.open) d.close('cancel');
    d.querySelector('.modal__title').textContent = titulo;
    d.querySelector('.modal__icon').textContent = icono;
    d.querySelector('.modal__body').replaceChildren(typeof mensaje === 'string' ? el('p', { text: mensaje }) : mensaje);
    const ok = d.querySelector('[data-modal="ok"]');
    const cancelar = d.querySelector('[data-modal="cancel"]');
    ok.textContent = textoOk;
    ok.className = `btn ${peligro ? 'btn--danger' : 'btn--primary'}`;
    cancelar.textContent = textoCancelar;
    cancelar.hidden = soloAviso;
    d.classList.toggle('modal--danger', peligro);
    d.returnValue = '';

    return new Promise((resolve) => {
      d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
      d.showModal();
      (soloAviso ? ok : cancelar).focus(); // el foco empieza en la opción segura
    });
  }
  const confirmar = (opciones) => abrirModal(opciones);
  const aviso = (opciones) => abrirModal({ ...opciones, soloAviso: true });

  /* ---------- Tarjeta de cita (renderizado con createElement) ---------- */
  const ESTADOS = {
    confirmada: { texto: 'Próxima', clase: 'badge--ok' },
    completada: { texto: 'Completada', clase: 'badge--muted' },
    cancelada: { texto: 'Cancelada', clase: 'badge--danger' }
  };

  /** Recibe una cita enriquecida y devuelve un <article> listo para insertar. */
  function crearTarjetaCita(c) {
    const estado = ESTADOS[c.estadoReal];
    return el('article', { class: `cita-card cita-card--${c.estadoReal}`, dataset: { id: c.id } },
      el('div', { class: 'cita-card__date', 'aria-hidden': 'true' },
        el('span', { text: fecha.diaSemana(c.fecha) }),
        el('strong', { text: fecha.dia(c.fecha) }),
        el('span', { text: fecha.mes(c.fecha) })
      ),
      el('div', { class: 'cita-card__body' },
        el('h3', { class: 'cita-card__title', text: c.servicio.nombre }),
        el('p', { class: 'cita-card__meta', text: `${fecha.larga(c.fecha)} · ${c.hora} h` }),
        el('p', { class: 'cita-card__meta', text: `Con ${c.barbero.nombre} · ${c.codigo}` }),
        el('span', { class: `badge ${estado.clase}`, text: estado.texto })
      ),
      el('div', { class: 'cita-card__side' },
        el('span', { class: 'cita-card__price', text: precio(c.servicio.precio) }),
        el('div', { class: 'cita-card__actions' },
          c.estadoReal === 'confirmada'
            ? el('button', { type: 'button', class: 'cita-card__cancel', dataset: { action: 'cancelar-cita', id: c.id } }, 'Cancelar')
            : null,
          el('a', { class: 'cita-card__link', href: `detalle.html?id=${c.id}` }, 'Ver detalle ›')
        )
      )
    );
  }

  /** Modal de confirmación + cancelación. Devuelve true si se canceló. */
  async function confirmarCancelacion(id) {
    const cita = getCita(id);
    if (!cita) return false;
    const c = enriquecer(cita);
    const ok = await confirmar({
      titulo: '¿Cancelar esta cita?',
      mensaje: `${c.servicio.nombre} · ${fecha.larga(c.fecha)} a las ${c.hora} h con ${c.barbero.nombre}. El hueco quedará libre para otro cliente.`,
      textoOk: 'Sí, cancelar cita',
      textoCancelar: 'Mantenerla',
      peligro: true,
      icono: '!'
    });
    if (ok) {
      cancelarCita(id);
      toast('Cita cancelada correctamente');
    }
    return ok;
  }

  /* ---------- Menú hamburguesa (móvil / tablet) ---------- */
  function initMenu() {
    const header = document.querySelector('.mobile-header');
    const boton = header && header.querySelector('.menu-toggle');
    const navLateral = document.querySelector('.sidebar__nav');
    if (!boton || !navLateral) return;

    // El menú se construye clonando los enlaces del sidebar: una sola fuente de verdad.
    const lista = el('ul', { class: 'mobile-menu__list' });
    navLateral.querySelectorAll('a').forEach((a) => {
      const enlace = a.cloneNode(true);
      enlace.className = 'mobile-menu__link';
      lista.append(el('li', {}, enlace));
    });
    lista.append(el('li', {}, el('button', { type: 'button', class: 'mobile-menu__link mobile-menu__logout', dataset: { action: 'logout' } }, '↩ Cerrar sesión')));
    const menu = el('nav', { id: 'menuMovil', class: 'mobile-menu', 'aria-label': 'Menú móvil' }, lista);
    header.append(menu);
    boton.setAttribute('aria-controls', 'menuMovil');

    const estaAbierto = () => boton.getAttribute('aria-expanded') === 'true';
    function setAbierto(abierto) {
      boton.setAttribute('aria-expanded', String(abierto));
      boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', abierto);
      document.body.classList.toggle('menu-abierto', abierto);
    }

    boton.addEventListener('click', () => setAbierto(!estaAbierto()));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setAbierto(false); });
    document.addEventListener('click', (e) => { if (estaAbierto() && !header.contains(e.target)) setAbierto(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && estaAbierto()) {
        setAbierto(false);
        boton.focus();
      }
    });
    // Si se agranda la ventana hasta desktop, el menú se cierra solo
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setAbierto(false); });
  }

  /* ---------- Cerrar sesión (delegación: sirve para sidebar y menú móvil) ---------- */
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-action="logout"]')) return;
    const ok = await confirmar({
      titulo: '¿Cerrar sesión?',
      mensaje: 'Se borrarán los datos guardados en este navegador (citas, plan y perfil).',
      textoOk: 'Cerrar sesión',
      textoCancelar: 'Seguir aquí',
      icono: '↩'
    });
    if (ok) {
      storage.limpiar();
      window.location.href = 'login.html';
    }
  });

  /* ---------- Mostrar / ocultar contraseña ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle-password]');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.togglePassword);
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    btn.textContent = mostrar ? 'Ocultar' : 'Ver';
    btn.setAttribute('aria-pressed', String(mostrar));
  });

  initMenu();

  window.BF = {
    DB, KEYS, storage, fecha, precio, el,
    getServicio, getBarbero, getPlan,
    getUsuario, setUsuario, getPlanId, setPlanId,
    getCitas, getCita, crearCita, cancelarCita, estadoCita, enriquecer, ordenarCitas, proximaCita, getUltimaCitaId, huecoOcupado,
    toast, confirmar, aviso, crearTarjetaCita, confirmarCancelacion
  };
})();
