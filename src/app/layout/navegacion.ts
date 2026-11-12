import {
  LucideChartColumn,
  LucideClipboardList,
  LucideHeartHandshake,
  LucideIconData,
  LucideLogIn,
  LucideShoppingBasket,
  LucideSprout,
  LucideStore,
  LucideUsers,
} from '@lucide/angular';
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
  icono: LucideStore.icon,
  exacta: true,
};
const CARRITO: DestinoNavegacion = {
  etiqueta: 'Carrito',
  ruta: '/carrito',
  icono: LucideShoppingBasket.icon,
};

const VISITANTE: readonly DestinoNavegacion[] = [
  CATALOGO,
  CARRITO,
  { etiqueta: 'Entrar', ruta: '/login', icono: LucideLogIn.icon },
];

const POR_ROL: Record<Rol, readonly DestinoNavegacion[]> = {
  COMPRADOR: [
    CATALOGO,
    CARRITO,
    { etiqueta: 'Mis pedidos', ruta: '/mis-pedidos', icono: LucideClipboardList.icon },
  ],
  PRODUCTOR: [
    { etiqueta: 'Pedidos', ruta: '/productor/pedidos', icono: LucideClipboardList.icon },
    { etiqueta: 'Mis productos', ruta: '/productor/productos', icono: LucideSprout.icon },
    { etiqueta: 'Reporte', ruta: '/productor/reporte', icono: LucideChartColumn.icon },
  ],
  ADMIN: [
    { etiqueta: 'Productores', ruta: '/admin/productores', icono: LucideUsers.icon },
    { etiqueta: 'Pedidos', ruta: '/admin/pedidos', icono: LucideClipboardList.icon },
    { etiqueta: 'Impacto', ruta: '/admin/impacto', icono: LucideHeartHandshake.icon },
  ],
};

/** Destinos de navegación de la sección 6. "Salir" lo agrega el Shell como botón. */
export function destinosPara(rol: Rol | null): readonly DestinoNavegacion[] {
  return rol ? POR_ROL[rol] : VISITANTE;
}
