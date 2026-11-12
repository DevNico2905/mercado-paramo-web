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
        data: { titulo: 'Catálogo' },
        loadComponent: provisional,
      },
      {
        path: 'productos/:id',
        title: titulo('Producto'),
        data: { titulo: 'Detalle de producto' },
        loadComponent: provisional,
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
        data: { titulo: 'Crear cuenta' },
        canActivate: [guestGuard],
        loadComponent: provisional,
      },
      {
        path: 'carrito',
        title: titulo('Carrito'),
        data: { titulo: 'Carrito' },
        loadComponent: provisional,
      },
      {
        path: 'mis-pedidos',
        title: titulo('Mis pedidos'),
        data: { titulo: 'Mis pedidos' },
        canActivate: [authGuard, roleGuard(['COMPRADOR'])],
        loadComponent: provisional,
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
