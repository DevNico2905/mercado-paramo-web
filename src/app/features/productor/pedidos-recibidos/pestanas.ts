import { EstadoPedido, Pedido } from '../../../core/api/models';
import { EstadoDelProductor } from '../../../core/api/productor-service';

export type Pestana = 'por-atender' | 'en-curso' | 'historial';

export const PESTANAS: readonly { valor: Pestana; etiqueta: string; estados: EstadoPedido[] }[] = [
  { valor: 'por-atender', etiqueta: 'Por atender', estados: ['PENDIENTE'] },
  { valor: 'en-curso', etiqueta: 'En curso', estados: ['ACEPTADO'] },
  { valor: 'historial', etiqueta: 'Historial', estados: ['ENTREGADO', 'RECHAZADO', 'CANCELADO'] },
];

export const PESTANA_POR_DEFECTO: Pestana = 'por-atender';

/** Estados que se pueden elegir dentro del historial. */
export const ESTADOS_HISTORIAL: readonly { valor: EstadoPedido; etiqueta: string }[] = [
  { valor: 'ENTREGADO', etiqueta: 'Entregados' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazados' },
  { valor: 'CANCELADO', etiqueta: 'Cancelados' },
];

export function leerPestana(valor: string | undefined): Pestana {
  return PESTANAS.find((pestana) => pestana.valor === valor)?.valor ?? PESTANA_POR_DEFECTO;
}

export function pestanaDe(estado: EstadoPedido): Pestana {
  return PESTANAS.find((pestana) => pestana.estados.includes(estado))?.valor ?? 'historial';
}

export function agruparPorPestana(pedidos: Pedido[]): Record<Pestana, Pedido[]> {
  const grupos: Record<Pestana, Pedido[]> = { 'por-atender': [], 'en-curso': [], historial: [] };
  for (const pedido of pedidos) {
    grupos[pestanaDe(pedido.estado)].push(pedido);
  }
  return grupos;
}

export interface AccionPedido {
  estado: EstadoDelProductor;
  etiqueta: string;
  /** Verbo en pasado para el aviso de éxito. */
  hecho: string;
  estilo: 'principal' | 'peligro';
  confirmar: boolean;
}

const ACEPTAR: AccionPedido = {
  estado: 'ACEPTADO',
  etiqueta: 'Aceptar pedido',
  hecho: 'Aceptaste',
  estilo: 'principal',
  confirmar: false,
};
const RECHAZAR: AccionPedido = {
  estado: 'RECHAZADO',
  etiqueta: 'Rechazar',
  hecho: 'Rechazaste',
  estilo: 'peligro',
  confirmar: true,
};
const ENTREGAR: AccionPedido = {
  estado: 'ENTREGADO',
  etiqueta: 'Marcar entregado',
  hecho: 'Marcaste como entregado',
  estilo: 'principal',
  confirmar: false,
};

/** Acciones válidas del productor para cada estado (SPEC 5.2). Los estados finales no tienen. */
export function accionesDelProductor(estado: EstadoPedido): readonly AccionPedido[] {
  switch (estado) {
    case 'PENDIENTE':
      return [ACEPTAR, RECHAZAR];
    case 'ACEPTADO':
      return [ENTREGAR];
    default:
      return [];
  }
}
