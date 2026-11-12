import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Estado vacío ilustrado, con un mensaje humano. La acción sugerida (un enlace o un botón)
 * se proyecta como contenido.
 */
@Component({
  selector: 'app-empty-state',
  template: `
    <div
      class="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center motion-safe:animate-aparecer"
    >
      <div class="relative flex size-28 items-center justify-center" aria-hidden="true">
        <span
          class="absolute inset-0 rotate-6 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] bg-musgo-100"
        ></span>
        <span
          class="absolute inset-2 -rotate-6 rounded-[55%_45%_40%_60%/45%_55%_45%_55%] bg-frailejon-100"
        ></span>
        <span class="relative text-5xl">{{ emoji() }}</span>
      </div>
      <h2 class="mt-6 text-2xl font-semibold">{{ titulo() }}</h2>
      @if (mensaje(); as texto) {
        <p class="mt-2 text-roca-900/80">{{ texto }}</p>
      }
      <div class="mt-6 empty:hidden"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class EmptyState {
  readonly emoji = input('🌱');
  readonly titulo = input.required<string>();
  readonly mensaje = input<string>();
}
