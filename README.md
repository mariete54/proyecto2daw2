# ✂ BarberFlow

Web de reservas para una barbería: dashboard con buscador de citas, reserva paso a paso, perfil y planes de suscripción.

**HTML5 · CSS3 (Mobile First, Grid + Flexbox) · JavaScript Vanilla ES6+**, sin frameworks ni dependencias.

- 🌐 Web desplegada: `PEGAR AQUÍ LA URL`
- 🎨 Prototipo Figma: `PEGAR AQUÍ EL ENLACE`
- 📄 Memoria técnica: [MEMORIA.md](MEMORIA.md)

## Ejecutar en local

No necesita instalación ni compilación. Abre `login.html` o `index.html` en el navegador, o usa la extensión **Live Server** de VS Code.

## Funcionalidades

- Validación de formularios en tiempo real con mensajes propios (login, registro, reserva, perfil).
- Datos simulados en `js/mockData.js`, persistidos en `localStorage`.
- Dashboard con tarjetas generadas por JS, buscador y filtros por estado.
- Menú hamburguesa en móvil y tablet.
- Modales de confirmación (`<dialog>`) para cancelar citas, cambiar de plan, confirmar reservas y cerrar sesión.

## Estructura

```
├── *.html          8 páginas + documentacion.html
├── css/styles.css  Estilos Mobile First
└── js/
    ├── mockData.js     Base de datos simulada
    ├── app.js          Núcleo compartido (datos, modal, menú, toast)
    ├── validation.js   Validador reutilizable
    └── pages/          Un script por página
```
