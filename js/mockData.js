/* =========================================================
   BARBERFLOW — mockData.js
   Base de datos simulada del Proyecto 1 (Figma).
   Cada colección es un array de objetos, igual que vendría
   de una API REST. Las fechas de las citas se calculan
   relativas al día de hoy para que siempre haya citas
   "próximas" y "pasadas" al abrir la web.
   ========================================================= */
(function () {
  'use strict';

  /** Devuelve la fecha (AAAA-MM-DD) desplazada `dias` respecto a hoy. Evita los domingos. */
  function fechaRelativa(dias) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dias);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // domingo cerrado → lunes
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  const usuario = {
    nombre: 'Alejandro',
    apellidos: 'Hernández',
    email: 'alejandro@email.com',
    telefono: '+34 612 345 678',
    clienteDesde: '2024-03-01',
    plan: 'flow'
  };

  const servicios = [
    { id: 'corte-signature', nombre: 'Corte Signature', duracion: 45, precio: 18, icono: '✂', descripcion: 'Corte a tijera y máquina con lavado' },
    { id: 'corte-barba', nombre: 'Corte + Barba', duracion: 60, precio: 26, icono: '✂', descripcion: 'El combo completo, con toalla caliente' },
    { id: 'ritual-barba', nombre: 'Ritual de barba', duracion: 30, precio: 14, icono: '✦', descripcion: 'Perfilado, aceites y masaje facial' }
  ];

  const barberos = [
    { id: 'marcos', nombre: 'Marcos', especialidad: 'Fade y degradados' },
    { id: 'lucia', nombre: 'Lucía', especialidad: 'Tijera y estilo clásico' },
    { id: 'dani', nombre: 'Dani', especialidad: 'Barbas y afeitado' }
  ];

  const horarios = ['10:00', '11:30', '16:00', '17:15', '18:30', '19:30'];

  const citas = [
    { id: 2001, servicioId: 'corte-barba', barberoId: 'marcos', fecha: fechaRelativa(2), hora: '18:30', estado: 'confirmada' },
    { id: 2002, servicioId: 'ritual-barba', barberoId: 'dani', fecha: fechaRelativa(9), hora: '11:30', estado: 'confirmada' },
    { id: 2003, servicioId: 'corte-signature', barberoId: 'lucia', fecha: fechaRelativa(16), hora: '17:15', estado: 'confirmada' },
    { id: 1004, servicioId: 'corte-signature', barberoId: 'marcos', fecha: fechaRelativa(-12), hora: '10:00', estado: 'confirmada' },
    { id: 1003, servicioId: 'corte-barba', barberoId: 'lucia', fecha: fechaRelativa(-25), hora: '18:30', estado: 'cancelada' },
    { id: 1002, servicioId: 'corte-barba', barberoId: 'marcos', fecha: fechaRelativa(-40), hora: '16:00', estado: 'confirmada' },
    { id: 1001, servicioId: 'ritual-barba', barberoId: 'dani', fecha: fechaRelativa(-70), hora: '19:30', estado: 'confirmada' }
  ];

  const planes = [
    { id: 'esencial', nombre: 'Esencial', precio: 14, icono: '✂', descripcion: 'Para mantener tu estilo sin complicaciones.', ventajas: ['1 corte al mes', 'Reserva online', 'Historial de visitas'] },
    { id: 'flow', nombre: 'Flow', precio: 25, icono: '✦', descripcion: 'La experiencia completa para cuidarte cada mes.', ventajas: ['2 cortes al mes', 'Prioridad al reservar', '10% en productos'] },
    { id: 'signature', nombre: 'Signature', precio: 39, icono: '✂', descripcion: 'Cuidado premium, siempre que lo necesites.', ventajas: ['3 servicios al mes', 'Barbero preferente', 'Retoques incluidos'] }
  ];

  window.MOCK_DATA = Object.freeze({ usuario, servicios, barberos, horarios, citas, planes });
})();
