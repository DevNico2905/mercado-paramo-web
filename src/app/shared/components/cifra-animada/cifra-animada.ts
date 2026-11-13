import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { CopPipe } from '../../pipes/cop-pipe';

const DURACION_MS = 1400;

/** Curva que arranca rápido y frena al final. */
const frenar = (t: number) => 1 - Math.pow(1 - t, 3);

function sinMovimiento(): boolean {
  return (
    typeof matchMedia !== 'function' ||
    typeof requestAnimationFrame !== 'function' ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Cifra grande que cuenta desde cero hasta su valor. Con movimiento reducido muestra el
 * valor final de inmediato. Los lectores de pantalla solo oyen el valor final.
 */
@Component({
  selector: 'app-cifra-animada',
  template: `<span aria-hidden="true" class="tabular-nums">{{ textoMostrado() }}</span
    ><span class="sr-only">{{ textoFinal() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CifraAnimada {
  private readonly locale = inject(LOCALE_ID);
  private readonly cop = new CopPipe();

  readonly valor = input.required<number>();
  readonly formato = input<'cop' | 'entero'>('entero');

  protected readonly mostrado = signal(0);
  private cuadro: number | null = null;

  protected readonly textoMostrado = computed(() => this.formatear(this.mostrado()));
  protected readonly textoFinal = computed(() => this.formatear(this.valor()));

  constructor() {
    effect(() => {
      const destino = this.valor();
      untracked(() => this.animar(destino));
    });
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  private formatear(valor: number): string {
    return this.formato() === 'cop'
      ? this.cop.transform(valor)
      : formatNumber(valor, this.locale, '1.0-0');
  }

  private animar(destino: number): void {
    this.detener();
    if (sinMovimiento()) {
      this.mostrado.set(destino);
      return;
    }
    const origen = this.mostrado();
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / DURACION_MS);
      this.mostrado.set(Math.round(origen + (destino - origen) * frenar(avance)));
      this.cuadro = avance < 1 ? requestAnimationFrame(paso) : null;
    };
    this.cuadro = requestAnimationFrame(paso);
  }

  private detener(): void {
    if (this.cuadro !== null) {
      cancelAnimationFrame(this.cuadro);
      this.cuadro = null;
    }
  }
}
