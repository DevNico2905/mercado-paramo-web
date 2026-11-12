import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideCheck, LucideX } from '@lucide/angular';
import { EstadoPedido } from '../../../core/api/models';

export interface PasoPedido {
  etiqueta: string;
  detalle: string;
  situacion: 'hecho' | 'actual' | 'pendiente' | 'fallido';
}

const CAMINO: readonly { estado: EstadoPedido; etiqueta: string; detalle: string }[] = [
  { estado: 'PENDIENTE', etiqueta: 'Pendiente', detalle: 'El productor está por confirmarlo' },
  { estado: 'ACEPTADO', etiqueta: 'Aceptado', detalle: 'El productor prepara tu pedido' },
  { estado: 'ENTREGADO', etiqueta: 'Entregado', detalle: 'El pedido llegó a su destino' },
];

const FINALES_ALTERNATIVOS: Partial<Record<EstadoPedido, { etiqueta: string; detalle: string }>> = {
  RECHAZADO: { etiqueta: 'Rechazado', detalle: 'El productor no pudo atenderlo' },
  CANCELADO: { etiqueta: 'Cancelado', detalle: 'El comprador canceló el pedido' },
};

/** Pasos de la línea de tiempo para un estado de pedido (SPEC 3.3 y 5.2). */
export function pasosDelPedido(estado: EstadoPedido): PasoPedido[] {
  const finalAlternativo = FINALES_ALTERNATIVOS[estado];
  if (finalAlternativo) {
    return [
      { ...CAMINO[0], situacion: 'hecho' },
      { ...finalAlternativo, situacion: 'fallido' },
      { ...CAMINO[2], situacion: 'pendiente' },
    ];
  }
  const actual = CAMINO.findIndex((paso) => paso.estado === estado);
  const ultimo = CAMINO.length - 1;
  return CAMINO.map((paso, indice) => ({
    etiqueta: paso.etiqueta,
    detalle: paso.detalle,
    situacion:
      indice < actual || (indice === actual && actual === ultimo)
        ? 'hecho'
        : indice === actual
          ? 'actual'
          : 'pendiente',
  }));
}

@Component({
  selector: 'app-order-timeline',
  imports: [LucideCheck, LucideX],
  templateUrl: './order-timeline.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class OrderTimeline {
  readonly estado = input.required<EstadoPedido>();

  protected readonly pasos = computed(() => pasosDelPedido(this.estado()));
}
