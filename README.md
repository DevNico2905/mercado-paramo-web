# Mercado Páramo · Web

Venta directa entre pequeños productores de Guasca y compradores, sin intermediarios: **lo que pagas llega a quien lo cultivó.**

- **Demo en vivo:** https://mercadoparamo.nick-bern.com
- **Backend (Spring Boot):** https://github.com/DevNico2905/mercado-paramo
- **API y Swagger:** https://api.mercadoparamo.nick-bern.com/swagger-ui.html

## Contexto

Mercado Páramo es el Proyecto Integrador I de la Universidad de La Salle. Conecta a pequeños productores de Guasca (Cundinamarca, páramo de Chingaza) con compradores. Vendiendo con intermediarios, el productor recibe entre el 15 y el 25 % del precio final; en Mercado Páramo recibe el 95 %, porque la plataforma retiene solo un 5 % de comisión. Una fundación verifica a cada productor antes de que pueda publicar.

Este repositorio contiene solo el frontend. El backend, con su propio README, está en el enlace de arriba.

## Funcionalidades por rol

**Visitante**
- Explora el catálogo por categoría y por productor; los filtros quedan en la URL para compartirla.
- Ve el detalle de cada producto con el medidor de impacto de su compra.
- Arma un carrito sin cuenta; al confirmar se le pide iniciar sesión y vuelve al carrito.
- Crea una cuenta de comprador o de productor.

**Comprador**
- Confirma pedidos con dirección de entrega y pago contra entrega.
- Ve una confirmación con lo que recibe el productor, según los valores que devuelve la API.
- Sigue sus pedidos en una línea de tiempo, los filtra por estado y fechas, y cancela los pendientes.

**Productor**
- Publica, edita, oculta y vuelve a mostrar sus productos, con vista previa en vivo de la tarjeta.
- Atiende pedidos en pestañas (por atender, en curso, historial): acepta, rechaza o marca entregado.
- Consulta su reporte de ventas por periodo, con lo que recibió y su participación real.
- Mientras la fundación no lo verifique, ve un aviso en todas sus pantallas; se desbloquea sin recargar cuando lo aprueban.

**Fundación (administrador)**
- Verifica o rechaza a los productores pendientes.
- Consulta todos los pedidos de la plataforma, en modo de solo lectura, con filtros completos.
- Presenta el impacto: cuánto dinero llegó directamente a los productores frente a lo que habrían recibido con intermediarios.

## Diseño

El concepto es **"Del páramo a tu mesa"**: una estética orgánica, cálida y editorial, inspirada en el paisaje del páramo.

| Token | Color | Uso |
| --- | --- | --- |
| `musgo-900` | `#1E3B2D` | Encabezados, header |
| `musgo-700` | `#2F5D46` | Color primario, botones |
| `musgo-100` | `#E3EDE6` | Fondos suaves |
| `frailejon-400` | `#E8B931` | Acento e indicador de impacto |
| `frailejon-100` | `#FBF1D3` | Avisos positivos |
| `tierra-600` | `#8C5A3C` | Detalles secundarios |
| `niebla-50` | `#F5F3EC` | Fondo general |
| `roca-900` | `#2B2B26` | Texto de cuerpo |
| `peligro-600` | `#B42318` | Errores y acciones destructivas |

Tipografías: **Fraunces** para títulos y cifras grandes, **Inter** para la interfaz.

Componentes distintivos:
- **ImpactMeter.** Compara lo que recibe el productor en Mercado Páramo (95 %) con lo que recibiría con intermediarios (15–25 %), en pesos y con barras. Tiene una variante compacta para el carrito y una completa para el detalle, la confirmación, el reporte y el impacto.
- **Arte por categoría.** La API no tiene fotos de productos; cada tarjeta muestra un degradado, la silueta del páramo y un emoji por categoría.
- **Línea de tiempo del pedido.** Pendiente → Aceptado → Entregado, con los finales alternativos (rechazado y cancelado) marcados en rojo.

La interfaz es **mobile-first**: se diseñó primero para 360 px, con áreas táctiles de al menos 44 px, barra de navegación inferior en móvil y header en escritorio.

En **accesibilidad**:
- Una auditoría con axe-core (WCAG 2.1 A y AA) no encontró infracciones en ninguna pantalla a 360, 768 y 1280 px.
- Todo el texto cumple el contraste AA y todos los campos tienen etiqueta.
- El foco es visible también sobre fondos oscuros, y toda la app se usa con teclado; menús y diálogos se cierran con Esc.
- Las animaciones respetan `prefers-reduced-motion`.

## Stack

| Tema | Elección |
| --- | --- |
| Framework | Angular 22: componentes standalone, signals, control flow nativo, `OnPush` |
| Estilos | Tailwind CSS v4 con los tokens de diseño en `@theme` |
| Iconos | `@lucide/angular`, con los datos de cada icono desde `@lucide/icons` |
| Tipos de la API | Generados desde `openapi.json` con `openapi-typescript` |
| Formularios | Reactive Forms tipados |
| Pruebas | Vitest (102 pruebas unitarias) |

## Arquitectura

```
src/app/
├── core/       api/ (tipos generados y un servicio por recurso), auth/, cart/, ui/
├── shared/     componentes reutilizables (ImpactMeter, ProductCard, OrderTimeline…) y pipes
├── layout/     Shell: header, navegación por rol, menú de cuenta, toasts y diálogo
└── features/   publico/, comprador/, productor/, admin/
```

Decisiones clave:
- **`TokenStorage` es la única puerta al token.** Ningún otro archivo sabe dónde se guarda, así que migrar a una cookie HttpOnly solo exige cambiar ese archivo.
- **Interceptores funcionales.** `authInterceptor` añade el `Bearer` solo a las peticiones dirigidas a la API. `errorInterceptor` resuelve de forma centralizada:
  - el 401: cierra la sesión y lleva al login con `?redirect=`;
  - el 403: muestra el mensaje del servidor;
  - los errores de red y 5xx: muestra un aviso de conexión.
- **Guards por rol.** `authGuard`, `roleGuard([...])` y `guestGuard`. Si el rol no corresponde, el usuario vuelve al inicio de su rol.
- **Carrito de un solo productor**, como exige la API. Se guarda en `localStorage` y pide confirmación antes de cambiar de productor.
- **Lazy loading.** Cada pantalla se carga en diferido. Los iconos se cargan como datos, un módulo por icono, para que cada uno viaje solo con su pantalla. El bundle inicial pesa unos 100 kB comprimidos.

## Cómo ejecutar

Requisitos: **Node 24 LTS** y el backend corriendo en `http://localhost:8080` (ver su repositorio).

```bash
npm ci            # instala las dependencias
npm start         # http://localhost:4200, contra la API local
npm run gen:api   # regenera src/app/core/api/schema.d.ts desde openapi.json
npm test          # pruebas unitarias con Vitest
npm run build     # build de producción en dist/mercado-paramo-web/browser
```

La URL de la API se configura en `src/environments/environment.ts` (desarrollo) y `environment.prod.ts` (producción). No hay URLs de la API fuera de esos archivos.

## Despliegue

El frontend se publica en **AWS Amplify Hosting**. Cada push a `main` dispara un build con `amplify.yml`, que ejecuta `npm ci` y `npm run build` y publica `dist/mercado-paramo-web/browser`.

Una regla de reescritura de Amplify envía a `index.html` toda ruta que no sea un archivo estático, para que recargar una ruta de la SPA como `/mis-pedidos` no dé 404. El sitio se sirve en el dominio propio `mercadoparamo.nick-bern.com`, con certificado HTTPS gestionado por Amplify.

## Desarrollo guiado por especificación

El frontend se construyó a partir de dos documentos que son la fuente de verdad: [`SPEC.md`](SPEC.md) (requisitos, diseño, pantallas, criterios de aceptación y fases) y [`openapi.json`](openapi.json) (el contrato de la API). La regla era no inventar endpoints, campos ni valores; si algo faltaba, se preguntaba.

**El código del frontend fue generado por Claude Code a partir de esa especificación.** Nicolás:
- definió los requisitos y el diseño;
- aprobó cada fase antes de pasar a la siguiente;
- probó la aplicación manualmente;
- pidió correcciones, sobre todo de UX: la identidad del usuario en sesión, el aviso de verificación en todas las pantallas del productor, la pluralización de unidades y la reactivación de productos ocultos.

Cuando la especificación y la API no coincidían, como con el estado de verificación o la vereda en el perfil, o la reactivación de productos, Nicolás amplió el backend y actualizó el contrato antes de continuar.

El trabajo avanzó por fases, cada una con su verificación:

| Fase | Contenido |
| --- | --- |
| 0 | Proyecto, Tailwind, tokens de diseño, entornos y tipos generados |
| 1 | Autenticación, interceptores, guards, toasts, diálogo de confirmación y Shell |
| 2–3 | Componentes compartidos; catálogo, detalle, login y registro |
| 4 | Carrito, confirmación y mis pedidos |
| 5 | Pantallas del productor |
| 6 | Pantallas de la fundación |
| 8 | Pulido: 404, accesibilidad, responsive, favicon y despliegue |

En cada fase, antes de pedir la aprobación:
- `npm run build` sin errores ni advertencias, y las pruebas unitarias;
- recorridos en el navegador a 360 y 1280 px con la API simulada;
- un resumen de lo hecho y de cómo probarlo.

Los extras P2 de la fase 7 se incorporaron a las fases de cada rol. Los commits siguen Conventional Commits.

## Autor

**Nicolás Esteban Bernal Rodríguez** · [@DevNico2905](https://github.com/DevNico2905)
