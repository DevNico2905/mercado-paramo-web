import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards';
import { Shell } from './layout/shell';

const provisional = () =>
  import('./features/provisional/pantalla-provisional').then((m) => m.PantallaProvisional);

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
            data: { titulo: 'Mis productos' },
            loadComponent: provisional,
          },
          {
            path: 'productos/nuevo',
            title: titulo('Nuevo producto'),
            data: { titulo: 'Nuevo producto' },
            loadComponent: provisional,
          },
          {
            path: 'productos/:id/editar',
            title: titulo('Editar producto'),
            data: { titulo: 'Editar producto' },
            loadComponent: provisional,
          },
          {
            path: 'pedidos',
            title: titulo('Pedidos recibidos'),
            data: { titulo: 'Pedidos recibidos' },
            loadComponent: provisional,
          },
          {
            path: 'reporte',
            title: titulo('Reporte de ventas'),
            data: { titulo: 'Reporte de ventas' },
            loadComponent: provisional,
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
