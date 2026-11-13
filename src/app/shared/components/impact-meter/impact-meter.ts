import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideHeartHandshake } from '@lucide/icons';
import { iconos } from '../../iconos';
import {
  PARTICIPACION_CON_INTERMEDIARIOS as INTERMEDIARIOS,
  PARTICIPACION_PRODUCTOR,
} from '../../../core/impacto';
import { CopPipe } from '../../pipes/cop-pipe';

/**
 * Medidor de impacto: compara lo que recibe el productor con intermediarios (15–25 %) y en
 * Mercado Páramo (95 %), y muestra el monto en pesos que le llega.
 */
@Component({
  selector: 'app-impact-meter',
  imports: [CopPipe, LucideDynamicIcon],
  templateUrl: './impact-meter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ImpactMeter {
  protected readonly iconos = iconos({ LucideHeartHandshake });

  private readonly locale = inject(LOCALE_ID);

  readonly variante = input<'compacta' | 'completa'>('completa');
  /** Valor total de la compra o de las ventas, en pesos. */
  readonly total = input.required<number>();
  /**
   * Monto oficial que recibe el productor, calculado por la API. Si no se indica, se estima
   * como el 95 % del total, solo para mostrar.
   */
  readonly montoProductor = input<number | null>(null);
  /** Participación real en porcentaje (por ejemplo, la de un reporte). Por defecto, 95. */
  readonly porcentaje = input<number | null>(null);
  /** Quién lee el medidor; cambia la redacción del mensaje. */
  readonly perspectiva = input<'comprador' | 'productor' | 'plataforma'>('comprador');
  readonly productor = input<string | null>(null);
  readonly vereda = input<string | null>(null);

  protected readonly intermediarios = INTERMEDIARIOS;

  protected readonly monto = computed(
    () => this.montoProductor() ?? Math.round(this.total() * PARTICIPACION_PRODUCTOR),
  );
  protected readonly participacion = computed(
    () => this.porcentaje() ?? PARTICIPACION_PRODUCTOR * 100,
  );
  protected readonly participacionTexto = computed(
    () => `${formatNumber(this.participacion(), this.locale, '1.0-1')}\u00a0%`,
  );
  protected readonly anchoBarra = computed(() => Math.min(100, Math.max(0, this.participacion())));
  /** Primer nombre del productor, para un tono cercano: "llegan a Pedro". */
  protected readonly nombreCorto = computed(() => this.productor()?.trim().split(/\s+/)[0] ?? null);
  protected readonly sufijoVereda = computed(() => {
    const vereda = this.vereda()?.trim();
    return vereda ? ` en la vereda ${vereda}` : '';
  });
  protected readonly conIntermediarios = computed(() => ({
    minimo: Math.round((this.total() * INTERMEDIARIOS.minimo) / 100),
    maximo: Math.round((this.total() * INTERMEDIARIOS.maximo) / 100),
  }));
}
