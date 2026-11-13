import { EstadoPedido } from './models';
import { FiltrosPedidos } from './pedidos-service';

export const ESTADOS: readonly { valor: EstadoPedido; etiqueta: string }[] = [
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'ACEPTADO', etiqueta: 'Aceptados' },
  { valor: 'ENTREGADO', etiqueta: 'Entregados' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazados' },
  { valor: 'CANCELADO', etiqueta: 'Cancelados' },
];

/** Opciones de orden: cada una se traduce a `ordenarPor` y `direccion` (SPEC 5.1). */
export const ORDENES = {
  recientes: { etiqueta: 'Más recientes', ordenarPor: 'FECHA', direccion: 'DESC' },
  antiguos: { etiqueta: 'Más antiguos', ordenarPor: 'FECHA', direccion: 'ASC' },
  'mayor-total': { etiqueta: 'Mayor total', ordenarPor: 'TOTAL', direccion: 'DESC' },
} as const satisfies Record<string, { etiqueta: string } & FiltrosPedidos>;

export type Orden = keyof typeof ORDENES;
export const ORDEN_POR_DEFECTO: Orden = 'recientes';

/** Filtros tal como viajan en la URL de la pantalla. */
export interface FiltrosEnUrl {
  estado: EstadoPedido | null;
  desde: string | null;
  hasta: string | null;
  orden: Orden;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function aFecha(valor: string | undefined): string | null {
  return valor && FECHA.test(valor) && !Number.isNaN(Date.parse(valor)) ? valor : null;
}

/** Lee los query params de la pantalla y descarta los valores inválidos. */
export function leerFiltros(query: {
  estado?: string;
  desde?: string;
  hasta?: string;
  orden?: string;
}): FiltrosEnUrl {
  return {
    estado: ESTADOS.find(({ valor }) => valor === query.estado)?.valor ?? null,
    desde: aFecha(query.desde),
    hasta: aFecha(query.hasta),
    orden: query.orden && query.orden in ORDENES ? (query.orden as Orden) : ORDEN_POR_DEFECTO,
  };
}

export function rangoInvalido({ desde, hasta }: FiltrosEnUrl): boolean {
  return desde !== null && hasta !== null && desde > hasta;
}

/** Query params de la API (SPEC 5.1) para unos filtros de pantalla. */
export function aFiltrosDeApi(filtros: FiltrosEnUrl): FiltrosPedidos {
  const { ordenarPor, direccion } = ORDENES[filtros.orden];
  const api: FiltrosPedidos = { ordenarPor, direccion };
  if (filtros.estado) {
    api.estado = filtros.estado;
  }
  if (filtros.desde) {
    api.desde = filtros.desde;
  }
  if (filtros.hasta) {
    api.hasta = filtros.hasta;
  }
  return api;
}
