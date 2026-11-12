# Mercado Páramo Web · Especificación del frontend

> Documento para desarrollo guiado por especificación (SDD). Es la fuente de verdad del frontend: si algo no está aquí ni en `openapi.json`, **no se inventa; se pregunta**.

## 0. Instrucciones para el agente de código

1. Lee este documento completo y `openapi.json` antes de escribir código.
2. **No inventes endpoints, campos ni valores de enums.** Todo sale de `openapi.json`. Si algo falta, detente y pregunta.
3. **No modifiques el backend.** Este repositorio es solo el frontend.
4. Implementa **por fases** (sección 12). Al final de cada fase: `npm run build` sin errores ni advertencias nuevas, y un resumen de lo hecho y de cómo probarlo.
5. Commits pequeños con Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`), uno por unidad coherente de trabajo.
6. Nada de secretos en el código. Nada de código comentado. Nada de `any` salvo justificación explícita.

---

## 1. Contexto

**Mercado Páramo** es una plataforma de venta directa entre pequeños productores de Guasca (Cundinamarca, páramo de Chingaza) y compradores, sin intermediarios. Hoy, con intermediarios, el productor recibe solo el **15–25 %** del precio final; en Mercado Páramo recibe el **95 %** (la plataforma retiene un 5 % de comisión).

- **Usuarios:** compradores, productores (baja alfabetización digital, conectividad rural) y un ADMIN de la fundación que verifica productores.
- **Backend:** API REST en Spring Boot, ya desplegada en `https://api.mercadoparamo.nick-bern.com` (Swagger en `/swagger-ui.html`).
- **Frontend (este repo):** se desplegará en `https://mercadoparamo.nick-bern.com` con AWS Amplify Hosting.

**El mensaje central del producto, que la interfaz debe hacer sentir en cada compra:** *"Lo que pagas llega a quien lo cultivó."*

---

## 2. Stack y convenciones

| Tema | Decisión |
| --- | --- |
| Framework | Angular, última versión estable. **Standalone components**, **signals** para el estado, control flow nuevo (`@if`, `@for`, `@switch`), `ChangeDetectionStrategy.OnPush` |
| Estilos | **Tailwind CSS v4** (vía `@tailwindcss/postcss`). Sin librerías de componentes de terceros |
| Iconos | `@lucide/angular` (sucesor oficial de `lucide-angular`, compatible con Angular 22) |
| Formularios | Reactive Forms, tipados |
| HTTP | `HttpClient` con interceptores funcionales |
| Tipos de la API | Generados desde `openapi.json` con `openapi-typescript` → `src/app/core/api/schema.d.ts`. Los servicios usan esos tipos; no se duplican interfaces a mano |
| Rutas | Lazy loading por funcionalidad (`loadComponent` / `loadChildren`) |
| Idioma | Interfaz 100 % en español (Colombia). Código en inglés o español, pero consistente por archivo |
| Moneda | Pesos colombianos sin decimales: `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`, expuesto como pipe `cop` |
| Fechas | Pipe `date` con locale `es-CO` registrado |
| Configuración | `apiUrl` en `src/environments/environment.ts` (`http://localhost:8080`) y `environment.prod.ts` (`https://api.mercadoparamo.nick-bern.com`) |

---

## 3. Diseño: identidad y experiencia

### 3.1 Concepto

**"Del páramo a tu mesa."** Una estética **orgánica, cálida y editorial**, inspirada en el paisaje de páramo: verdes musgo, el amarillo del frailejón, tierra y la niebla de la montaña. Debe sentirse como una marca cuidada, no como un panel administrativo genérico.

### 3.2 Tokens de diseño (definir en el `@theme` de Tailwind)

| Token | Valor | Uso |
| --- | --- | --- |
| `musgo-900` | `#1E3B2D` | Texto fuerte, encabezados, header |
| `musgo-700` | `#2F5D46` | **Primario**: botones principales, enlaces |
| `musgo-100` | `#E3EDE6` | Fondos suaves, chips seleccionados |
| `frailejon-400` | `#E8B931` | **Acento**: destacados, indicador de impacto, badges |
| `frailejon-100` | `#FBF1D3` | Fondos de avisos positivos |
| `tierra-600` | `#8C5A3C` | Secundario, detalles |
| `niebla-50` | `#F5F3EC` | Fondo general de la app |
| `roca-900` | `#2B2B26` | Texto de cuerpo |
| `peligro-600` | `#B42318` | Errores, rechazar, cancelar |

Contraste mínimo **WCAG AA** en todo texto.

**Tipografía:** `Fraunces` (títulos, cifras grandes) + `Inter` (interfaz y cuerpo), desde Google Fonts.

**Forma:** bordes redondeados generosos (`rounded-2xl` en tarjetas), sombras suaves y difusas, mucho aire.

### 3.3 Componentes distintivos (la "firma" visual del producto)

1. **Medidor de impacto (`ImpactMeter`)**. Es el componente estrella. Una comparación visual entre lo que recibe el productor **con intermediarios (15–25 %)** y **en Mercado Páramo (95 %)**, más el monto en pesos que recibe el productor en esa compra.
   - Variantes: `compacta` (una línea, en el carrito) y `completa` (con dos barras animadas, en el detalle del producto, la confirmación del pedido, el reporte del productor y el impacto del ADMIN).
   - Ejemplo de texto: *"De tus $24.000, **$22.800 llegan a Pedro** en la vereda La Concepción."*
2. **Arte por categoría (sin fotos).** La API no tiene imágenes de productos. Cada tarjeta muestra un fondo con degradado y un emoji grande según la categoría: Tubérculos 🥔, Lácteos 🧀, Frutas 🍓, Hortalizas 🥬, Hierbas y aromáticas 🌿 (otra: 🌾). Debe verse intencional y bonito, no como un sustituto pobre de una foto.
3. **Línea de tiempo del pedido (`OrderTimeline`).** Un stepper con los estados `PENDIENTE → ACEPTADO → ENTREGADO`, que marca en rojo los finales alternativos `RECHAZADO` y `CANCELADO`.
4. **Insignia de estado (`StatusBadge`).** Un color por estado de pedido y de verificación.
5. **Barra fija del carrito.** En móvil, cuando el carrito tiene ítems, una barra inferior fija dice *"Ver carrito · 3 productos · $36.000"*.
6. **Carrito como panel lateral** (escritorio) o **bottom sheet** (móvil).

### 3.4 Principios de UX

- **Mobile-first.** Se diseña primero para 360 px de ancho. Áreas táctiles de **mínimo 44 × 44 px**.
- **Pocas decisiones por pantalla**, sobre todo para el productor: botones grandes con verbo claro ("Aceptar pedido", "Marcar entregado"), sin jerga técnica.
- **Navegación por rol.** En móvil, una **barra inferior** con 3–4 destinos según el rol. En escritorio, un **header** con los mismos destinos.
- **Siempre hay feedback:** skeletons al cargar, *toasts* al terminar una acción, estados vacíos ilustrados con un mensaje humano y una acción sugerida ("Aún no tienes pedidos. Explora el catálogo →").
- **Confirmación antes de acciones irreversibles** (rechazar, cancelar, desactivar producto), con un diálogo propio, no `window.confirm`.
- **Microanimaciones sutiles** (entrada de tarjetas, barras del medidor de impacto), respetando `prefers-reduced-motion`.
- **Accesibilidad:** `label` en todos los campos, foco visible, navegación por teclado, `aria-live` para los *toasts*.

---

## 4. Arquitectura

```
src/app/
├── core/
│   ├── api/            schema.d.ts (generado) + un servicio por recurso
│   ├── auth/           AuthService, TokenStorage, authInterceptor, errorInterceptor, guards
│   ├── cart/           CartService
│   └── ui/             ToastService, ConfirmService
├── shared/
│   ├── components/     ImpactMeter, ProductCard, CategoryArt, StatusBadge, OrderTimeline,
│   │                   EmptyState, Skeleton, ConfirmDialog, PageHeader, MoneyInput
│   └── pipes/          cop
├── layout/             Shell (header, barra inferior, contenedor de toasts)
└── features/
    ├── publico/        catalogo, producto-detalle, login, registro
    ├── comprador/      carrito, checkout, mis-pedidos
    ├── productor/      mis-productos, producto-form, pedidos-recibidos, reporte-ventas
    └── admin/          productores, pedidos, impacto
```

### 4.1 Autenticación

- **`TokenStorage`**: única clase que sabe dónde se guarda el token. Implementación actual: `localStorage` con las claves `mp_token` y `mp_token_expira` (timestamp calculado con `expiraEnSegundos`). Toda la app usa esta abstracción, para poder migrar a una cookie HttpOnly en el futuro cambiando un solo archivo.
- **`AuthService`** (signals): `usuario` (perfil de `/api/usuarios/me` o `null`), `rol`, `estaAutenticado`, `login()`, `logout()`, `cargarPerfil()`. Al iniciar la app, si hay un token vigente, carga el perfil. Si el token venció, cierra la sesión.
- **`authInterceptor`**: agrega `Authorization: Bearer <token>` **solo** a las peticiones dirigidas a `environment.apiUrl`.
- **`errorInterceptor`**:
  - **401** en una petición autenticada → `logout()` y redirección a `/login?redirect=<ruta actual>`, con el toast "Tu sesión expiró. Inicia sesión de nuevo." (No aplica al propio `POST /api/auth/login`, cuyo 401 lo maneja el formulario.)
  - **403** → toast con el `message` del servidor.
  - **0 / 5xx** → toast "No pudimos conectar con el servidor. Intenta de nuevo."
- **Guards:** `authGuard` (requiere sesión) y `roleGuard(['PRODUCTOR'])`, etc. Si el rol no coincide, redirige al inicio de su rol.
- **Inicio por rol tras el login:** COMPRADOR → `/` · PRODUCTOR → `/productor/pedidos` · ADMIN → `/admin/productores`. Si existe `?redirect=`, tiene prioridad.

### 4.2 Carrito

- **`CartService`** con signals, persistido en `localStorage` (`mp_carrito`).
- Guarda: `productorId`, `productorNombre`, `vereda` e ítems (`productoId`, `nombre`, `unidad`, `precio`, `cantidad`, `stock`, `categoriaNombre`).
- **Un solo productor por carrito** (regla de la API). Si el usuario agrega un producto de otro productor, aparece un diálogo: *"Tu carrito tiene productos de Pedro. Un pedido solo puede ser de un productor. ¿Vaciar el carrito y agregar este producto de Ana?"*
- Cantidad entre 1 y el `stock` disponible.
- Computados: `total`, `cantidadItems`, `montoProductor` (`total × 0.95`, **solo para mostrar**; el valor oficial lo calcula la API).
- Un visitante sin sesión puede armar el carrito. Al confirmar, si no tiene sesión, se le lleva al login y se le devuelve al checkout.
- Si hay sesión de PRODUCTOR o ADMIN, el botón "Agregar" no se muestra.

### 4.3 Manejo de errores de la API

Todos los errores siguen este formato:

```json
{ "timestamp": "...", "status": 400, "error": "Bad Request",
  "message": "Texto para el usuario", "path": "/api/...", "errores": { "campo": "mensaje" } }
```

- `errores` con contenido (400 de validación) → mostrar cada mensaje **debajo de su campo** en el formulario.
- En cualquier otro caso → mostrar `message`.
- **409 por stock** al crear un pedido → mostrar el mensaje y volver a consultar el stock de los productos del carrito.

---

## 5. Contrato con la API

La referencia completa es `openapi.json`. Resumen:

| Método | Ruta | Rol | Uso en el frontend |
| --- | --- | --- | --- |
| POST | `/api/auth/registro` | Público | Registro (rol `COMPRADOR` o `PRODUCTOR`; `vereda` es obligatoria para productor; `descripcion` opcional) |
| POST | `/api/auth/login` | Público | `{ token, tipo, expiraEnSegundos }` |
| GET | `/api/usuarios/me` | Autenticado | Perfil y rol (sin prefijo `ROLE_`) |
| GET | `/api/categorias` | Público | Filtro del catálogo y formulario de producto |
| GET | `/api/productos?categoriaId=&productorId=` | Público | Catálogo |
| GET | `/api/productos/{id}` | Público | Detalle |
| GET, POST | `/api/productor/productos` | PRODUCTOR | Mis productos, crear |
| PUT, DELETE | `/api/productor/productos/{id}` | PRODUCTOR | Editar, desactivar (204) |
| GET | `/api/productor/pedidos` | PRODUCTOR | Pedidos recibidos (filtros, sección 5.1) |
| PATCH | `/api/productor/pedidos/{id}/estado` | PRODUCTOR | `{ "estado": "ACEPTADO" \| "RECHAZADO" \| "ENTREGADO" }` |
| GET | `/api/productor/reportes/ventas?desde=&hasta=` | PRODUCTOR | Reporte (fechas `YYYY-MM-DD`; por defecto, los últimos 30 días) |
| POST, GET | `/api/pedidos` | COMPRADOR | Crear pedido `{ direccionEntrega, items: [{ productoId, cantidad }] }`, mis pedidos |
| PATCH | `/api/pedidos/{id}/cancelar` | COMPRADOR | Cancelar (solo en PENDIENTE) |
| GET | `/api/admin/productores?estado=` | ADMIN | Lista de productores |
| PATCH | `/api/admin/productores/{id}/verificacion` | ADMIN | `{ "estado": "VERIFICADO" \| "RECHAZADO" }` (solo desde PENDIENTE) |
| GET | `/api/admin/pedidos` | ADMIN | Todos los pedidos (filtros, sección 5.1) |
| GET | `/api/admin/reportes/impacto` | ADMIN | Indicador de impacto |

### 5.1 Filtros de listados de pedidos (query params, todos opcionales)

`estado` · `desde` y `hasta` (`YYYY-MM-DD`) · `ordenarPor` (`FECHA` | `TOTAL` | `ESTADO`) · `direccion` (`ASC` | `DESC`). Por defecto: todos, por fecha descendente.

### 5.2 Transiciones de estado del pedido

| Desde | Puede pasar a | Quién |
| --- | --- | --- |
| PENDIENTE | ACEPTADO, RECHAZADO | Productor |
| PENDIENTE | CANCELADO | Comprador |
| ACEPTADO | ENTREGADO | Productor |
| RECHAZADO, ENTREGADO, CANCELADO | — (finales) | — |

**La interfaz solo muestra las acciones válidas** para el estado actual y el rol.

### 5.3 Datos que la API no tiene (no inventarlos)

- **Fotos de productos**: se usa el arte por categoría (sección 3.3).
- **Estado de verificación en `/me`**: se agrega en el backend (ticket MP-14). Mientras tanto, el frontend interpreta el 403 *"Tu cuenta de productor aún no ha sido verificada"* al crear un producto.

---

## 6. Rutas

| Ruta | Pantalla | Acceso | Prioridad |
| --- | --- | --- | --- |
| `/` | Catálogo | Público | P1 |
| `/productos/:id` | Detalle de producto | Público | P1 |
| `/login` | Iniciar sesión | Solo sin sesión | P1 |
| `/registro` | Crear cuenta | Solo sin sesión | P1 |
| `/carrito` | Carrito y confirmación | Público (confirmar requiere COMPRADOR) | P1 |
| `/mis-pedidos` | Mis pedidos | COMPRADOR | P1 |
| `/productor/productos` | Mis productos | PRODUCTOR | P1 |
| `/productor/productos/nuevo`, `/productor/productos/:id/editar` | Formulario de producto | PRODUCTOR | P1 |
| `/productor/pedidos` | Pedidos recibidos | PRODUCTOR | P1 |
| `/productor/reporte` | Reporte de ventas | PRODUCTOR | P2 |
| `/admin/productores` | Verificación de productores | ADMIN | P1 |
| `/admin/pedidos` | Todos los pedidos | ADMIN | P2 |
| `/admin/impacto` | Indicador de impacto | ADMIN | P2 |
| `**` | Página 404 amigable | Público | P1 |

**Navegación (barra inferior en móvil / header en escritorio):**
- Visitante: Catálogo · Carrito · Entrar
- COMPRADOR: Catálogo · Carrito · Mis pedidos · Salir
- PRODUCTOR: Pedidos · Mis productos · Reporte · Salir
- ADMIN: Productores · Pedidos · Impacto · Salir

---

## 7. Pantallas: comportamiento y criterios de aceptación

### 7.1 Catálogo (`/`) · P1

- **Hero** breve con el mensaje del producto ("Lo que pagas llega a quien lo cultivó") y una cifra del impacto: "Los productores reciben el 95 %".
- **Chips de categoría** desplazables horizontalmente (incluye "Todas"), y un selector de productor opcional.
- **Grilla** de `ProductCard`: arte por categoría, nombre, precio por unidad (`$12.000 / libra`), productor y vereda, stock bajo resaltado (≤ 5: "¡Quedan 3!") y el botón "Agregar".
- **Criterios:** filtrar por categoría actualiza la URL (`?categoria=`), para poder compartirla. Skeleton al cargar. Estado vacío si no hay productos.

### 7.2 Detalle de producto (`/productos/:id`) · P1

- Arte grande, nombre, precio, unidad, stock, categoría y una tarjeta del productor (nombre, vereda).
- Selector de cantidad (1…stock) y "Agregar al carrito".
- **`ImpactMeter` completo** calculado sobre `precio × cantidad`.
- **Criterios:** un id inexistente o un producto inactivo (404) muestra el estado "Este producto ya no está disponible", con enlace al catálogo.

### 7.3 Login (`/login`) · P1

- Email y contraseña con validación. Un 401 muestra "Correo o contraseña incorrectos" **en el formulario**, sin toast global.
- Enlace a registro. Respeta `?redirect=`.

### 7.4 Registro (`/registro`) · P1

- **Paso 1:** elegir rol con dos tarjetas grandes: "Quiero comprar" / "Soy productor de Guasca".
- **Paso 2:** nombre, email, teléfono, contraseña (mínimo 8, con indicador de fortaleza) y, **solo si es productor**, vereda (obligatoria) y descripción (opcional, "Cuéntanos qué produces").
- Al registrarse, **inicia sesión automáticamente** con las mismas credenciales.
- Al productor se le muestra: "¡Bienvenido! La fundación verificará tu cuenta antes de que puedas publicar."
- **Criterios:** los errores `errores.*` aparecen bajo su campo. Un 409 (email repetido) muestra "Ya existe una cuenta con este correo".

### 7.5 Carrito y confirmación (`/carrito`) · P1

- Lista de ítems con cantidad editable (1…stock) y opción de quitar. Encabezado: "Tu pedido a **Pedro** · vereda La Concepción".
- Resumen: total, **`ImpactMeter` compacto** ("$22.800 llegan a Pedro").
- Campo **dirección de entrega** (obligatorio, máximo 200 caracteres) y la nota "Pago contra entrega".
- Botón **"Confirmar pedido"** → `POST /api/pedidos`.
- **Éxito:** vacía el carrito y muestra una pantalla de confirmación celebratoria con el número de pedido, el `ImpactMeter` completo con los valores **devueltos por la API** (`total`, `comision`, `montoProductor`) y el enlace a "Mis pedidos".
- **Criterios:** sin sesión → login con `redirect=/carrito`. Un 409 de stock muestra el mensaje y refresca el stock. El botón se deshabilita mientras se envía (evita pedidos dobles).

### 7.6 Mis pedidos (`/mis-pedidos`) · P1 (filtros P2)

- Tarjetas de pedido: número, fecha, productor, `StatusBadge`, total y botón expandir.
- Al expandir: `OrderTimeline`, detalle de ítems, dirección y monto que recibe el productor.
- **"Cancelar pedido"** solo en PENDIENTE, con confirmación.
- **P2:** filtros por estado y rango de fechas, y orden (más recientes, mayor total).

### 7.7 Mis productos (`/productor/productos`) · P1

- **Banner de verificación** si el productor está PENDIENTE ("Tu cuenta está en revisión…") o RECHAZADO (con indicación de contactar a la fundación). Mientras no esté verificado, "Nuevo producto" está deshabilitado y explica por qué.
- Lista o tarjetas con nombre, precio, stock y el estado activo/inactivo, con editar y desactivar (con confirmación).
- **Criterios:** los inactivos se muestran atenuados con la etiqueta "Oculto del catálogo".

### 7.8 Formulario de producto · P1

- Nombre (máx. 100), unidad (máx. 20, con sugerencias: libra, kilo, unidad, litro, docena, atado), precio (entero en pesos, > 0), stock (≥ 0) y categoría (de `/api/categorias`).
- **Vista previa en vivo** de cómo se verá la `ProductCard` en el catálogo.
- Crear → `POST`; editar → `PUT`.

### 7.9 Pedidos recibidos (`/productor/pedidos`) · P1 (filtros P2)

- Pestañas o chips por estado, con contadores: **Por atender** (PENDIENTE) · En curso (ACEPTADO) · Historial (el resto).
- Tarjeta de pedido: comprador, teléfono (enlace `tel:`), dirección, ítems, total y **"Tú recibes $X"** destacado.
- Acciones según el estado: **Aceptar** / **Rechazar** (con confirmación) en PENDIENTE; **Marcar entregado** en ACEPTADO.
- **Criterios:** después de una acción, el pedido se mueve de pestaña sin recargar la página. Un 409 (transición inválida) muestra el mensaje y recarga la lista.

### 7.10 Reporte de ventas (`/productor/reporte`) · P2

- Selector de rango (atajos: últimos 7 días, últimos 30 días, este mes; y un rango personalizado).
- Tarjetas con cifras grandes (tipografía Fraunces): pedidos entregados, total vendido y **"Recibiste $X"**.
- **`ImpactMeter` completo** con la participación real (`participacionPorcentaje`). Si viene `null`: estado vacío "Aún no tienes ventas entregadas en este periodo".
- Tabla o barras de ventas por producto, ordenadas por total.

### 7.11 Verificación de productores (`/admin/productores`) · P1

- Pestañas: **Pendientes** (por defecto, con contador) · Verificados · Rechazados.
- Tarjeta: nombre, email, teléfono, vereda y descripción.
- **"Verificar"** y **"Rechazar"** (con confirmación).
- **Criterios:** al verificar, el productor sale de Pendientes sin recargar la página.

### 7.12 Todos los pedidos (`/admin/pedidos`) · P2

- Tabla en escritorio y tarjetas en móvil: número, fecha, comprador, productor, estado y total.
- Filtros completos (sección 5.1).

### 7.13 Impacto (`/admin/impacto`) · P2

- **Pantalla protagonista para la sustentación.** Cifras grandes: productores verificados, pedidos entregados, total vendido y **"$X llegaron directamente a los productores"**.
- **`ImpactMeter` completo** a nivel de plataforma, contrastando 95 % contra 15–25 %.
- Estado vacío elegante si todavía no hay ventas.

---

## 8. Calidad

- `npm run build` (producción) sin errores.
- Responsive comprobado en 360 px, 768 px y 1280 px.
- Sin errores en la consola del navegador en los flujos principales.
- Lighthouse (móvil) con Accesibilidad ≥ 90.
- Nada de URLs de la API escritas fuera de `environment*.ts`.

---

## 9. Despliegue (AWS Amplify Hosting)

`amplify.yml` en la raíz:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist/mercado-paramo-web/browser
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Regla de reescritura para la SPA** (en la consola de Amplify → *Rewrites and redirects*), para que recargar una ruta como `/mis-pedidos` no dé 404:

| Source | Target | Type |
| --- | --- | --- |
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

---

## 10. Flujo de la demo (debe funcionar de punta a punta)

1. Un visitante explora el catálogo y abre un producto: ve el medidor de impacto.
2. **Pedro** se registra como productor y ve el banner "en revisión".
3. El **ADMIN** verifica a Pedro.
4. Pedro publica "Queso campesino" con una vista previa en vivo.
5. **María** agrega 2 quesos al carrito, se registra y confirma el pedido: ve "$22.800 llegan a Pedro".
6. Pedro acepta el pedido y luego lo marca entregado.
7. María ve en la línea de tiempo que su pedido fue entregado.
8. Pedro abre su reporte (95 %) y el ADMIN abre la pantalla de impacto.

---

## 11. Fuera de alcance

Pagos en línea, imágenes de productos, notificaciones, chat, recuperación de contraseña, edición de perfil e internacionalización.

---

## 12. Fases de implementación

| Fase | Contenido | Verificación |
| --- | --- | --- |
| 0 | Proyecto Angular, Tailwind v4, fuentes, tokens de la sección 3.2, `environment*.ts`, tipos generados desde `openapi.json`, pipe `cop` | `npm run build` OK; una página de prueba muestra la paleta y las fuentes |
| 1 | `core/`: TokenStorage, AuthService, interceptores, guards, ToastService, ConfirmService. `layout/`: Shell con navegación por rol | Login real contra la API; la navegación cambia según el rol |
| 2 | Componentes compartidos: ImpactMeter, ProductCard, CategoryArt, StatusBadge, OrderTimeline, EmptyState, Skeleton | Se ven bien en 360 px y 1280 px |
| 3 | Público: catálogo, detalle, login, registro | Pasos 1–2 del flujo de la demo |
| 4 | Comprador: carrito, checkout, mis pedidos | Paso 5 y paso 7 |
| 5 | Productor: mis productos, formulario, pedidos recibidos | Pasos 4 y 6 |
| 6 | ADMIN: verificación de productores | Paso 3 |
| 7 | P2: reporte, impacto, todos los pedidos, filtros de pedidos | Paso 8 |
| 8 | Pulido: animaciones, estados vacíos, accesibilidad, página 404, `amplify.yml` | Sección 8 completa |
