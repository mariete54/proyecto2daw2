/* =========================================================
   BARBERFLOW — validation.js
   Validador de formularios reutilizable.
   · Desactiva los tooltips nativos del navegador (novalidate).
   · Valida al salir del campo (blur) y, a partir de ahí,
     en tiempo real mientras se escribe (input/change).
   · Pinta los mensajes en el DOM (<p class="field-error">)
     y marca los campos con aria-invalid para accesibilidad.

   Uso:
     Validator.crear(form, {
       email: [Validator.reglas.requerido(), Validator.reglas.email()],
       hora:  { tipo: 'radio', contenedor: elemento, reglas: [...] }
     }, { onSubmit(datos) {...}, onInvalid() {...} });

   Cada regla es una función (valor, input) => '' si es válido
   o el mensaje de error si no lo es.
   ========================================================= */
(function () {
  'use strict';

  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  const RE_LETRAS = /^[a-záéíóúüñàèìòùç' -]+$/i;
  const RE_MOVIL = /^(?:\+34|0034)?[6789]\d{8}$/;
  const vacio = (v) => v === null || v === undefined || String(v).trim() === '';

  function calcularEdad(nacimiento, hoy) {
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  /* ---------- Reglas (todas salvo `requerido` ignoran el valor vacío) ---------- */
  const reglas = {
    requerido: (msg = 'Este campo es obligatorio.') => (v) => (vacio(v) ? msg : ''),

    minLongitud: (n, msg) => (v) =>
      vacio(v) || v.trim().length >= n ? '' : msg || `Debe tener al menos ${n} caracteres.`,

    maxLongitud: (n, msg) => (v) =>
      vacio(v) || v.trim().length <= n ? '' : msg || `No puede superar los ${n} caracteres.`,

    email: (msg = 'Introduce un correo válido, por ejemplo nombre@dominio.com.') => (v) =>
      vacio(v) || RE_EMAIL.test(v.trim()) ? '' : msg,

    soloLetras: (msg = 'Solo se permiten letras, espacios y guiones.') => (v) =>
      vacio(v) || RE_LETRAS.test(v.trim()) ? '' : msg,

    nombreCompleto: (msg = 'Escribe tu nombre y al menos un apellido.') => (v) =>
      vacio(v) || v.trim().split(/\s+/).length >= 2 ? '' : msg,

    telefono: (msg = 'Introduce un móvil válido de 9 cifras (empieza por 6, 7, 8 o 9).') => (v) =>
      vacio(v) || RE_MOVIL.test(v.replace(/[\s-]/g, '')) ? '' : msg,

    password: () => (v) => {
      if (vacio(v)) return '';
      if (/\s/.test(v)) return 'La contraseña no puede contener espacios.';
      if (v.length < 8) return `Te faltan ${8 - v.length} caracteres (mínimo 8).`;
      if (!/[a-zñ]/i.test(v)) return 'Incluye al menos una letra.';
      if (!/\d/.test(v)) return 'Incluye al menos un número.';
      return '';
    },

    /** `getOtro` es una función que devuelve el valor con el que comparar. */
    coincide: (getOtro, msg = 'Las contraseñas no coinciden.') => (v) =>
      vacio(v) || v === getOtro() ? '' : msg,

    marcado: (msg = 'Debes aceptar para continuar.') => (v, input) => (input.checked ? '' : msg),

    /**
     * Fechas de <input type="date"> (valor AAAA-MM-DD).
     * Opciones: noPasada, noFutura, sinDomingos, maxDias, edadMinima
     */
    fecha: (opc = {}) => (v, input) => {
      if (input && input.validity && input.validity.badInput) return 'La fecha está incompleta o no es válida.';
      if (vacio(v)) return '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Usa el formato dd/mm/aaaa.';
      const f = BF.fecha.parseISO(v);
      if (Number.isNaN(f.getTime()) || BF.fecha.toISO(f) !== v) return 'Esa fecha no existe.';
      const hoy = BF.fecha.parseISO(BF.fecha.hoyISO());
      const diffDias = Math.round((f - hoy) / 86400000);

      if (opc.noPasada && diffDias < 0) return 'No puedes elegir una fecha pasada.';
      if (opc.noFutura && diffDias > 0) return 'La fecha no puede ser posterior a hoy.';
      if (opc.maxDias !== undefined && diffDias > opc.maxDias) return `Solo se puede reservar con ${opc.maxDias} días de antelación como máximo.`;
      if (opc.sinDomingos && f.getDay() === 0) return 'Los domingos la barbería está cerrada.';
      if (opc.edadMinima !== undefined) {
        const edad = calcularEdad(f, hoy);
        if (edad < opc.edadMinima) return `Debes tener al menos ${opc.edadMinima} años para registrarte.`;
        if (edad > 110) return 'Revisa el año de nacimiento.';
      }
      return '';
    }
  };

  /* ---------- Fábrica de validadores ---------- */
  function crear(form, esquema, { onSubmit, onInvalid } = {}) {
    form.setAttribute('novalidate', ''); // adiós a los tooltips del navegador

    const campos = Object.entries(esquema).map(([nombre, conf]) => {
      const def = Array.isArray(conf) ? { reglas: conf } : conf;
      const tipo = def.tipo || 'campo';
      const input = tipo === 'radio' ? def.contenedor : form.elements[nombre];
      const contenedor = def.contenedor || input.closest('.form-field') || input.parentElement;

      let error = contenedor.querySelector(':scope > .field-error');
      if (!error) {
        error = document.createElement('p');
        error.className = 'field-error';
        error.id = `${input.id || nombre}-error`;
        contenedor.append(error);
      }
      error.setAttribute('aria-live', 'polite');
      const describedby = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (!describedby.includes(error.id)) input.setAttribute('aria-describedby', [...describedby, error.id].join(' '));

      return { nombre, tipo, input, contenedor, error, reglas: def.reglas, tocado: false };
    });

    function leer(campo) {
      if (campo.tipo === 'radio') {
        const r = form.querySelector(`input[name="${campo.nombre}"]:checked`);
        return r ? r.value : '';
      }
      if (campo.input.type === 'checkbox') return campo.input.checked ? 'on' : '';
      return campo.input.value;
    }

    function pintar(campo, mensaje, valor) {
      campo.error.textContent = mensaje;
      campo.contenedor.classList.toggle('is-invalid', Boolean(mensaje));
      campo.contenedor.classList.toggle('is-valid', !mensaje && !vacio(valor) && campo.tipo !== 'radio');
      campo.input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    }

    function validarCampo(campo) {
      if (campo.input.disabled) return true;
      const valor = leer(campo);
      let mensaje = '';
      for (const regla of campo.reglas) {
        mensaje = regla(valor, campo.input);
        if (mensaje) break;
      }
      pintar(campo, mensaje, valor);
      return !mensaje;
    }

    const buscarCampo = (target) =>
      campos.find((c) => (c.tipo === 'radio' ? target.name === c.nombre : c.input === target));
    const revalidarTocados = () => campos.filter((c) => c.tocado).forEach(validarCampo);

    // blur → el campo pasa a "tocado" y se valida
    form.addEventListener('focusout', (e) => {
      const campo = buscarCampo(e.target);
      if (!campo || campo.tipo === 'radio') return;
      campo.tocado = true;
      validarCampo(campo);
    });

    // input → validación en tiempo real de los campos ya tocados
    // (también re-valida dependencias como "repetir contraseña")
    form.addEventListener('input', revalidarTocados);
    form.addEventListener('change', (e) => {
      const campo = buscarCampo(e.target);
      if (campo && (campo.tipo === 'radio' || ['checkbox', 'date'].includes(e.target.type))) campo.tocado = true;
      revalidarTocados();
    });

    function validar() {
      let primero = null;
      campos.forEach((c) => {
        c.tocado = true;
        if (!validarCampo(c) && !primero) primero = c;
      });
      if (primero) {
        const foco = primero.tipo === 'radio'
          ? primero.contenedor.querySelector('input:not(:disabled)') || primero.contenedor
          : primero.input;
        foco.focus();
        primero.contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return !primero;
    }

    function datos() {
      return Object.fromEntries(campos.map((c) => {
        const valor = leer(c);
        if (c.input.type === 'checkbox') return [c.nombre, Boolean(valor)];
        if (c.input.type === 'password') return [c.nombre, valor];
        return [c.nombre, valor.trim()];
      }));
    }

    function reset() {
      campos.forEach((c) => {
        c.tocado = false;
        pintar(c, '', '');
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validar()) {
        if (onSubmit) onSubmit(datos(), e);
      } else if (onInvalid) {
        onInvalid();
      }
    });

    return {
      validar,
      datos,
      reset,
      validarCampo: (nombre) => {
        const c = campos.find((x) => x.nombre === nombre);
        return c ? validarCampo(c) : true;
      }
    };
  }

  window.Validator = { crear, reglas };
})();
