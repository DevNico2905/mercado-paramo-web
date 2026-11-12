import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Guía de estilos · Mercado Páramo',
    loadComponent: () =>
      import('./features/dev/guia-estilos/guia-estilos').then((m) => m.GuiaEstilos),
  },
];
