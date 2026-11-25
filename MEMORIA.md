# BarberFlow · Memoria técnica del Frontend

Aplicación web de reservas para una barbería, construida con **HTML5 semántico, CSS3 (Mobile First) y JavaScript Vanilla (ES6+)**, sin frameworks ni dependencias.

| | Enlace |
|---|---|
| Prototipo en Figma (Proyecto 1) | `PEGAR AQUÍ EL ENLACE DE FIGMA` |
| Web desplegada | `PEGAR AQUÍ LA URL DE GITHUB PAGES / NETLIFY` |
| Repositorio | `PEGAR AQUÍ LA URL DEL REPOSITORIO` |

---

## 1. Estructura del proyecto

```
barberflow-html/
├── index.html            Dashboard: próxima cita, accesos rápidos, buscador y filtros de citas
├── login.html            Inicio de sesión (validación JS)
├── registro.html         Alta de cuenta (validación JS + medidor de contraseña)
├── crear.html            Nueva reserva: servicio → barbero → día → hora
├── mis-citas.html        Próximas citas e historial
├── detalle.html          Ficha de una cita (?id=…) con opción de cancelar
├── perfil.html           Datos personales en modo lectura / edición
├── planes.html           Planes de suscripción
├── documentacion.html    Resumen visual de la arquitectura (imprimible a PDF)
├── favicon.svg
├── css/
│   └── styles.css        Hoja de estilos única, Mobile First
└── js/
    ├── mockData.js       "Base de datos" simulada
    ├── app.js            Núcleo compartido (datos, fechas y componentes de UI)
    ├── validation.js     Validador de formularios reutilizable
    └── pages/            Un script por página
        ├── index.js  login.js  registro.js  crear.js
        └── mis-citas.js  detalle.js  perfil.js  planes.js
```

### 1.1 HTML

Cada página es un documento independiente con la misma estructura semántica:

- `<aside class="sidebar">` con un `<nav>` de navegación principal (escritorio).
- `<header class="mobile-header">` con el logo y el botón hamburguesa (móvil y tablet).
- `<main class="app-main">` con el contenido de la página. Es el único `<main>` del documento.
- `<nav class="bottom-nav">` con la barra inferior (móvil).
- `<section>`, `<article>` y `<aside>` agrupan el contenido según su significado: tarjeta de cita, ficha de detalle, resumen de la reserva…

Login y registro usan una plantilla propia (`.auth-shell`) en la que la imagen va a la izquierda y el formulario a la derecha.

**Accesibilidad:**
- `aria-current="page"` en el enlace activo.
- `aria-expanded` y `aria-controls` en el botón hamburguesa.
- `aria-invalid` y `aria-describedby` en los campos con error.
- `aria-live` en los mensajes de error y en el contador de resultados.
- `aria-pressed` en los filtros.
- Los radios de las opciones de reserva se ocultan con `.sr-only` y no con `hidden`, para que sigan siendo accesibles con el teclado.

### 1.2 CSS

Un único archivo, `css/styles.css`, organizado por bloques:

1. **Variables (`:root`)**: colores, tipografías, escala de tamaños, espaciados, radios, sombras y medidas de layout. Cambiar la paleta solo implica tocar este bloque.
2. **Reset** y utilidades (`.eyebrow`, `.sr-only`, `[hidden]`).
3. **Layout**: sidebar, cabecera móvil, menú hamburguesa y barra inferior.
4. **Componentes**: botones, tarjetas, formularios, validación, modal, buscador, chips, tarjetas de cita, planes, perfil…
5. **Media queries** al final, de menor a mayor anchura.

Los nombres de clase siguen una convención tipo **BEM**: `bloque__elemento--modificador`, por ejemplo `.cita-card__title` o `.cita-card--cancelada`. Los estados se expresan con clases `is-*` (`is-selected`, `is-open`, `is-invalid`) o con atributos ARIA (`[aria-pressed="true"]`, `[aria-expanded="true"]`).

### 1.3 JavaScript

Se usan **scripts clásicos con `defer`** en lugar de módulos ES. Así la web funciona también al abrir los HTML con doble clic (`file://`), donde los módulos fallan por CORS. Gracias a `defer`, los scripts se ejecutan en orden cuando el DOM ya está listo. Cada archivo va envuelto en una función autoejecutable y en modo estricto, y solo expone un objeto global: `MOCK_DATA`, `BF` o `Validator`.

Orden de carga en cada página:

```html
<script src="js/mockData.js" defer></script>     <!-- datos -->
<script src="js/app.js" defer></script>          <!-- núcleo: window.BF -->
<script src="js/validation.js" defer></script>   <!-- solo páginas con formulario -->
<script src="js/pages/<pagina>.js" defer></script>
```

---

## 2. Justificación de la maquetación

### 2.1 Mobile First

Los estilos base son los del móvil: una columna, cabecera con menú hamburguesa y barra de navegación inferior. Las media queries usan siempre `min-width` y **añaden** complejidad a medida que hay más espacio.

### 2.2 Cuándo Grid y cuándo Flexbox

**CSS Grid** se usa para las rejillas en dos dimensiones o en las que importan las columnas:

| Componente | Columnas |
|---|---|
| `.action-grid` (accesos rápidos) | 1 → 2 (≥640, la tarjeta ancha ocupa 2) → 3 (≥768) |
| `.cita-grid` (tarjetas del dashboard) | 1 → 2 (≥768) |
| `.cita-card` (interior de la tarjeta) | `auto 1fr` (bloque de fecha + contenido) y fila inferior a ancho completo con `grid-column: 1 / -1` |
| `.booking-layout` (reserva) | 1 → `1fr 310px` (≥1024) con resumen *sticky* |
| `.date-grid` / `.time-grid` | 5 días fijos / 3 → 6 horas (≥640) |
| `.barber-grid`, `.plan-grid` | `repeat(auto-fit, minmax(…, 1fr))`: se adaptan solos, sin media queries |
| `.detail-card` | 1 → `0.9fr 1.1fr` (≥768) |
| `.form-grid` (perfil) | 1 → 2 (≥640) |
| `.profile-layout` | 1 → `18rem 1fr` (≥768) |
| `.resumen-lista` (modal de reserva) | `auto 1fr`: etiqueta / valor |

**Flexbox** se usa para alinear en una sola dirección:

- Barras: sidebar, `.mobile-header` y `.bottom-nav`.
- Contenido de botones y tarjetas: icono + texto + flecha.
- `.field-wrap`: icono + input + botón "Ver".
- `.toolbar`: buscador y chips. Va en columna en móvil y en fila desde 768 px.
- `.chips`, con `flex-wrap`.
- `.auth-shell`: columna en móvil, fila desde 768 px.
- Botones del modal: `column-reverse` en móvil, para que la acción principal quede abajo, al alcance del pulgar; en fila desde 640 px.
- `.plan-card`: columna con `flex: 1` en la lista de ventajas, para que los botones de las tres tarjetas queden alineados abajo.

### 2.3 Puntos de ruptura

| Breakpoint | Dispositivo | Qué cambia |
|---|---|---|
| **Base (< 640 px)** | Móvil | 1 columna, cabecera con hamburguesa, barra inferior fija, 3 columnas de horas |
| **≥ 640 px** | Móvil grande / tablet vertical | Accesos rápidos a 2 columnas, perfil a 2 columnas, 6 columnas de horas, cabeceras de página y botones del modal en fila |
| **≥ 768 px** | Tablet | Login/registro en dos mitades, ficha de detalle en 2 columnas, tarjetas de cita a 2 columnas, buscador y filtros en una fila, más *padding* |
| **≥ 1024 px** | Escritorio | Aparece el **sidebar** fijo (16 rem) y desaparecen la cabecera móvil, el menú hamburguesa y la barra inferior; la reserva pasa a 2 columnas con el resumen *sticky* |
| **≥ 1280 px** | Escritorio grande | Títulos del *hero* más grandes |

Además, `@media (prefers-reduced-motion: reduce)` desactiva transiciones y animaciones.

---

## 3. Lógica JavaScript implementada

### 3.1 Datos: `mockData.js` + `localStorage`

`mockData.js` define `window.MOCK_DATA`, un objeto congelado con arrays de objetos que imitan las tablas del modelo de datos del Proyecto 1:

```js
servicios: [{ id: 'corte-barba', nombre: 'Corte + Barba', duracion: 60, precio: 26, ... }]
barberos:  [{ id: 'marcos', nombre: 'Marcos', especialidad: 'Fade y degradados' }]
citas:     [{ id: 2001, servicioId: 'corte-barba', barberoId: 'marcos', fecha: '2026-11-20', hora: '18:30', estado: 'confirmada' }]
```

Las citas guardan solo los **ids** del servicio y del barbero, como claves foráneas. `BF.enriquecer(cita)` resuelve esas relaciones y calcula campos derivados: estado real y código `BF-xxxx`. Las fechas se calculan **relativas a hoy**, así que siempre hay citas próximas y pasadas sin importar el día en que se abra la web.

La primera vez que se piden las citas, `app.js` copia las de `mockData` a `localStorage` (clave `bf_citas`). A partir de ahí, crear o cancelar citas, editar el perfil o cambiar de plan persiste entre páginas y recargas. Todas las lecturas y escrituras de `localStorage` van en `try/catch`: si el JSON está corrupto o el navegador bloquea el almacenamiento, la web sigue funcionando con los datos de `mockData`.

**Estado de una cita.** Se guarda `confirmada` o `cancelada`. El estado `completada` no se guarda: se calcula comparando la fecha y la hora con el momento actual.

### 3.2 Renderizado dinámico del DOM

- **Helper `BF.el(tag, props, ...hijos)`**: envoltorio de `document.createElement` que asigna clases, atributos, `dataset` y texto. Todo el texto se inserta con `textContent`, nunca con `innerHTML`, así que ningún dato de `localStorage` se interpreta como HTML (evita XSS).
- **`BF.crearTarjetaCita(cita)`**: genera la tarjeta `<article>` de una cita. Se reutiliza en el dashboard y en *Mis citas*.
- **Dashboard (`pages/index.js`)**:
  - `render()` lee las citas, las enriquece, las ordena (próximas de la más cercana a la más lejana; después el historial, de la más reciente a la más antigua), aplica el texto de búsqueda y el filtro, y sustituye todas las tarjetas de una vez con `replaceChildren(...)`.
  - **Buscador en tiempo real** (evento `input`): busca en servicio, barbero, fecha, hora y código. Antes de comparar normaliza el texto (quita tildes y pasa a minúsculas), así que "lucia" encuentra "Lucía".
  - **Filtros por estado**: botones con `aria-pressed`. Cada uno muestra cuántas citas coinciden con la búsqueda actual.
  - Contador de resultados, estado vacío con botón "Limpiar filtros" y tarjeta "Tu próxima cita" actualizada.
- **Reserva (`pages/crear.js`)**: servicios, barberos, los próximos 5 días laborables y las horas se generan desde los datos. Al cambiar de barbero o de día se vuelven a pintar las horas: las ocupadas o ya pasadas salen deshabilitadas y tachadas. El resumen lateral se actualiza con cada cambio.
- **Planes, Mis citas, Detalle y Perfil**: las tarjetas de planes se generan desde `MOCK_DATA.planes`. La ficha de detalle lee `?id=` de la URL con `URLSearchParams`.
- **Delegación de eventos**: un único listener en el contenedor gestiona los botones "Cancelar" de todas las tarjetas, incluidas las que se crean después.

### 3.3 Validación de formularios (`validation.js`)

`Validator.crear(form, esquema, { onSubmit, onInvalid })` recibe un esquema `{ nombreCampo: [reglas] }`. Una **regla** es una función `(valor, input) => mensaje` que devuelve `''` si el valor es válido. Para cada campo se aplican las reglas en orden y se muestra el primer error.

Flujo:

1. Al crear el validador se añade `novalidate` al formulario. Así se desactivan los *tooltips* nativos del navegador y los mensajes son siempre los nuestros.
2. Debajo de cada campo se crea un `<p class="field-error" aria-live="polite">`, enlazado al input con `aria-describedby`.
3. **`blur` (`focusout`)**: el campo pasa a "tocado" y se valida. No se muestran errores mientras el usuario todavía no ha terminado de escribir.
4. **`input` / `change`**: se revalidan **en tiempo real** todos los campos ya tocados. Así, si se corrige la contraseña original, el campo "Repite la contraseña" se actualiza solo.
5. **`submit`**: se cancela el envío (`preventDefault`), se validan todos los campos y, si hay errores, se lleva el foco al primero. Si todo es válido se llama a `onSubmit(datos)`.
6. El estado se refleja con clases (`.is-invalid` con borde rojo, `.is-valid` con ✓ verde) y con `aria-invalid`.

Reglas disponibles: `requerido`, `minLongitud`, `maxLongitud`, `email`, `soloLetras`, `nombreCompleto`, `telefono` (móvil español), `password` (8+ caracteres, letra, número y sin espacios), `coincide`, `marcado` (checkbox) y `fecha`. La regla `fecha` admite las opciones `noPasada`, `noFutura`, `sinDomingos`, `maxDias` y `edadMinima`, y detecta fechas incompletas (`validity.badInput`) e inexistentes (31 de febrero).

| Formulario | Campos validados |
|---|---|
| Login | Correo, contraseña (mín. 6) |
| Registro | Nombre y apellido, correo, fecha de nacimiento (no futura, ≥ 14 años), contraseña segura + medidor de seguridad, repetir contraseña, aceptar términos |
| Reserva | "Otra fecha" (no pasada, no domingo, ≤ 60 días), hora obligatoria y libre (grupo de radios) |
| Perfil | Nombre, apellidos, correo, móvil (solo al guardar en modo edición) |

### 3.4 Componentes interactivos (`app.js`)

- **Menú hamburguesa**: se construye clonando los enlaces del sidebar, de modo que solo hay una lista de enlaces que mantener. El botón alterna `aria-expanded`, y las tres barras se animan hasta formar una X con CSS. El menú se cierra con `Esc` (y devuelve el foco al botón), al hacer clic fuera, al elegir un enlace y al ensanchar la ventana hasta escritorio (`matchMedia`).
- **Modal**: usa el elemento nativo `<dialog>` con `showModal()`, que aporta el fondo oscurecido, la gestión del foco y el cierre con `Esc`. `BF.confirmar()` devuelve una **Promesa** que se resuelve a `true` o `false`, de modo que se usa con `await`:

  ```js
  if (await BF.confirmar({ titulo: '¿Cancelar esta cita?', peligro: true })) { ... }
  ```

  Se usa para cancelar citas, cerrar sesión, cambiar de plan, confirmar la reserva (con el resumen) y como aviso (bienvenida tras el registro, contacto). El foco empieza en la opción segura.
- **Toast**: aviso temporal con `role="status"`.
- **Mostrar/ocultar contraseña**: botones con `data-toggle-password`.

---

## 4. Pruebas y optimización

**Validación W3C.** Las 9 páginas HTML, `styles.css` y `favicon.svg` pasan el **Nu Html Checker** (el mismo motor que validator.w3.org) con **0 errores**.

**Pruebas funcionales.** Hay 63 comprobaciones automáticas ejecutadas sobre las páginas reales con un DOM simulado (jsdom). Cubren validaciones, buscador, filtros, modales, menú, reserva, perfil, planes y cancelación, sin errores de JavaScript.

**Consola del navegador en la web desplegada.** Comprobada en `PEGAR NAVEGADOR Y FECHA DE LA COMPROBACIÓN`.

**Optimizaciones aplicadas en esta entrega:**

- Fuentes de Google cargadas con `<link>` + `preconnect` en lugar de `@import` dentro del CSS. El `@import` obligaba a descargar primero el CSS y solo después las fuentes.
- `favicon.svg` (evita el 404 de `/favicon.ico` en consola) y `meta description` + `theme-color` en cada página.
- Todo el JS en archivos externos con `defer`. Ya no hay scripts en línea ni atributos `onclick`, y la lógica repetida en cada página, como cerrar sesión o el toast, está ahora en `app.js`.
- Estilos en línea sustituidos por clases reutilizables.
- Se ha eliminado `env(safe-area-inset-bottom)`. Sin `viewport-fit=cover` siempre vale 0, y además el validador CSS de la W3C lo marcaba como error.
- `prefers-reduced-motion` también desactiva las animaciones, no solo las transiciones.

---

## 5. Herramientas

- **Editor**: Visual Studio Code con Live Server y Prettier.
- **Control de versiones**: Git y GitHub.
- **Tecnologías**: HTML5, CSS3 y JavaScript ES6+ (sin librerías).
- **Despliegue**: GitHub Pages.
- **Validación**: W3C Nu Html Checker.
