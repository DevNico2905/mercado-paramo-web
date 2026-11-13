import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideMinus, LucidePlus } from '@lucide/icons';
import { iconos } from '../../iconos';

/** Selector de cantidad entre 1 y `maximo`, con botones táctiles de 48 px. */
@Component({
  selector: 'app-quantity-stepper',
  imports: [LucideDynamicIcon],
  template: `
    <div
      role="group"
      class="inline-flex items-center rounded-xl bg-white ring-1 ring-musgo-900/50 ring-inset"
      [attr.aria-label]="etiqueta()"
    >
      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-l-xl text-musgo-900 hover:bg-musgo-100 disabled:text-roca-900/30 disabled:hover:bg-transparent"
        aria-label="Quitar una unidad"
        [disabled]="cantidad() <= 1"
        (click)="cambio.emit(cantidad() - 1)"
      >
        <svg [lucideIcon]="iconos.LucideMinus" [size]="20" aria-hidden="true"></svg>
      </button>
      <output
        class="w-11 text-center font-display text-xl font-semibold text-musgo-900"
        aria-live="polite"
      >
        {{ cantidad() }}
      </output>
      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-r-xl text-musgo-900 hover:bg-musgo-100 disabled:text-roca-900/30 disabled:hover:bg-transparent"
        aria-label="Agregar una unidad"
        [disabled]="cantidad() >= maximo()"
        (click)="cambio.emit(cantidad() + 1)"
      >
        <svg [lucideIcon]="iconos.LucidePlus" [size]="20" aria-hidden="true"></svg>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
})
export class QuantityStepper {
  protected readonly iconos = iconos({ LucideMinus, LucidePlus });

  readonly cantidad = input.required<number>();
  readonly maximo = input.required<number>();
  readonly etiqueta = input('Cantidad');
  /** Nueva cantidad pedida, ya dentro del rango 1…máximo. */
  readonly cambio = output<number>();
}
