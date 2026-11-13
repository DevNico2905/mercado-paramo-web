import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards';
import { Shell } from './layout/shell';

const provisional = () =>
  import('./features/provisional/pantalla-provisional').then((m) => m.PantallaProvisional);

const productoForm = () =>
  import('./features/productor/producto-form/producto-form').then((m) => m.ProductoForm);

const titulo = (nombre: string) => `${nombre} · Mercado Páramo`;

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: titulo('Catálogo'),
        loadComponent: () => import('./features/publico/catalogo/catalogo').then((m) => m.Catalogo),
      },
      {
        path: 'productos/:id',
        title: titulo('Producto'),
        loadComponent: () =>
          import('./features/publico/producto-detalle/producto-detalle').then(
            (m) => m.ProductoDetalle,
          ),
      },
      {
        path: 'login',
        title: titulo('Iniciar sesión'),
        canActivate: [guestGuard],
        loadComponent: () => import('./features/publico/login/login').then((m) => m.Login),
      },
      {
        path: 'registro',
        title: titulo('Crear cuenta'),
        canActivate: [guestGuard],
        loadComponent: () => import('./features/publico/registro/registro').then((m) => m.Registro),
      },
      {
        path: 'carrito',
        title: titulo('Carrito'),
        loadComponent: () => import('./features/comprador/carrito/carrito').then((m) => m.Carrito),
      },
      {
        path: 'mis-pedidos',
        title: titulo('Mis pedidos'),
        canActivate: [authGuard, roleGuard(['COMPRADOR'])],
        loadComponent: () =>
          import('./features/comprador/mis-pedidos/mis-pedidos').then((m) => m.MisPedidos),
      },
      {
        path: 'productor',
        canActivate: [authGuard, roleGuard(['PRODUCTOR'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
          {
            path: 'productos',
            title: titulo('Mis productos'),
            loadComponent: () =>
              import('./features/productor/mis-productos/mis-productos').then(
                (m) => m.MisProductos,
              ),
          },
          {
            path: 'productos/nuevo',
            title: titulo('Nuevo producto'),
            loadComponent: productoForm,
          },
          {
            path: 'productos/:id/editar',
            title: titulo('Editar producto'),
            loadComponent: productoForm,
          },
          {
            path: 'pedidos',
            title: titulo('Pedidos recibidos'),
            loadComponent: () =>
              import('./features/productor/pedidos-recibidos/pedidos-recibidos').then(
                (m) => m.PedidosRecibidos,
              ),
          },
          {
            path: 'reporte',
            title: titulo('Reporte de ventas'),
            loadComponent: () =>
              import('./features/productor/reporte-ventas/reporte-ventas').then(
                (m) => m.ReporteVentas,
              ),
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'productores' },
          {
            path: 'productores',
            title: titulo('Verificación de productores'),
            data: { titulo: 'Verificación de productores' },
            loadComponent: provisional,
          },
          {
            path: 'pedidos',
            title: titulo('Todos los pedidos'),
            data: { titulo: 'Todos los pedidos' },
            loadComponent: provisional,
          },
          {
            path: 'impacto',
            title: titulo('Impacto'),
            data: { titulo: 'Impacto' },
            loadComponent: provisional,
          },
        ],
      },
      {
        path: '**',
        title: titulo('Página no encontrada'),
        data: { titulo: 'Página no encontrada' },
        loadComponent: provisional,
      },
    ],
  },
];
