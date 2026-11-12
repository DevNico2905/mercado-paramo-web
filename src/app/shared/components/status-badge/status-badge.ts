import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoPedido, EstadoVerificacion } from '../../../core/api/models';

interface Apariencia {
  etiqueta: string;
  clases: string;
}

const PEDIDO: Record<EstadoPedido, Apariencia> = {
  PENDIENTE: {
    etiqueta: 'Pendiente',
    clases: 'bg-frailejon-100 text-tierra-600 ring-frailejon-400',
  },
  ACEPTADO: { etiqueta: 'Aceptado', clases: 'bg-musgo-100 text-musgo-700 ring-musgo-700/30' },
  ENTREGADO: { etiqueta: 'Entregado', clases: 'bg-musgo-700 text-white ring-musgo-700' },
  RECHAZADO: { etiqueta: 'Rechazado', clases: 'bg-peligro-600 text-white ring-peligro-600' },
  CANCELADO: { etiqueta: 'Cancelado', clases: 'bg-white text-peligro-600 ring-peligro-600/40' },
};

const VERIFICACION: Record<EstadoVerificacion, Apariencia> = {
  PENDIENTE: { ...PEDIDO.PENDIENTE, etiqueta: 'En revisión' },
  VERIFICADO: { etiqueta: 'Verificado', clases: PEDIDO.ENTREGADO.clases },
  RECHAZADO: PEDIDO.RECHAZADO,
};

/** Insignia de estado de un pedido o de la verificación de un productor. */
@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset"
      [class]="apariencia().clases"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ apariencia().etiqueta }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly estado = input.required<EstadoPedido | EstadoVerificacion>();
  readonly tipo = input<'pedido' | 'verificacion'>('pedido');

  protected readonly apariencia = computed<Apariencia>(() => {
    const estado = this.estado();
    if (this.tipo() === 'verificacion' || estado === 'VERIFICADO') {
      return VERIFICACION[estado as EstadoVerificacion];
    }
    return PEDIDO[estado];
  });
}
