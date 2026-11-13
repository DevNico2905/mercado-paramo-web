import { LucideIconData } from '@lucide/angular';
import {
  LucideChartColumn,
  LucideClipboardList,
  LucideHeartHandshake,
  LucideLogIn,
  LucideShoppingBasket,
  LucideSprout,
  LucideStore,
  LucideUsers,
} from '@lucide/icons';
import { icono } from '../shared/iconos';
import { Rol } from '../core/api/models';

export interface DestinoNavegacion {
  etiqueta: string;
  ruta: string;
  icono: LucideIconData;
  /** La ruta solo se marca activa con coincidencia exacta. */
  exacta?: boolean;
}

const CATALOGO: DestinoNavegacion = {
  etiqueta: 'Catálogo',
  ruta: '/',
  icono: icono(LucideStore),
  exacta: true,
};
const CARRITO: DestinoNavegacion = {
  etiqueta: 'Carrito',
  ruta: '/carrito',
  icono: icono(LucideShoppingBasket),
};

const VISITANTE: readonly DestinoNavegacion[] = [
  CATALOGO,
  CARRITO,
  { etiqueta: 'Entrar', ruta: '/login', icono: icono(LucideLogIn) },
];

const POR_ROL: Record<Rol, readonly DestinoNavegacion[]> = {
  COMPRADOR: [
    CATALOGO,
    CARRITO,
    { etiqueta: 'Mis pedidos', ruta: '/mis-pedidos', icono: icono(LucideClipboardList) },
  ],
  PRODUCTOR: [
    { etiqueta: 'Pedidos', ruta: '/productor/pedidos', icono: icono(LucideClipboardList) },
    { etiqueta: 'Mis productos', ruta: '/productor/productos', icono: icono(LucideSprout) },
    { etiqueta: 'Reporte', ruta: '/productor/reporte', icono: icono(LucideChartColumn) },
  ],
  ADMIN: [
    { etiqueta: 'Productores', ruta: '/admin/productores', icono: icono(LucideUsers) },
    { etiqueta: 'Pedidos', ruta: '/admin/pedidos', icono: icono(LucideClipboardList) },
    { etiqueta: 'Impacto', ruta: '/admin/impacto', icono: icono(LucideHeartHandshake) },
  ],
};

/** Destinos de navegación de la sección 6. "Salir" lo agrega el Shell como botón. */
export function destinosPara(rol: Rol | null): readonly DestinoNavegacion[] {
  return rol ? POR_ROL[rol] : VISITANTE;
}
