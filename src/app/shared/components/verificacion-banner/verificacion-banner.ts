import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EstadoVerificacion } from '../../../core/api/models';

/** Aviso al productor que aún no puede publicar: cuenta en revisión o rechazada. */
@Component({
  selector: 'app-verificacion-banner',
  template: `
    @switch (estado()) {
      @case ('PENDIENTE') {
        <div
          role="status"
          class="flex items-start gap-4 rounded-2xl bg-frailejon-100 p-4 text-musgo-900 ring-1 ring-frailejon-400 ring-inset sm:p-5"
        >
          <span class="text-4xl leading-none" aria-hidden="true">⏳</span>
          <div>
            <p class="font-display text-xl font-semibold">Tu cuenta está en revisión</p>
            <p class="mt-1">
              La fundación está revisando tus datos. Cuando te aprueben, podrás publicar tus
              productos aquí.
            </p>
          </div>
        </div>
      }
      @case ('RECHAZADO') {
        <div
          role="status"
          class="flex items-start gap-4 rounded-2xl bg-peligro-600/10 p-4 text-roca-900 ring-1 ring-peligro-600/40 ring-inset sm:p-5"
        >
          <span class="text-4xl leading-none" aria-hidden="true">✋</span>
          <div>
            <p class="font-display text-xl font-semibold text-peligro-600">
              Tu cuenta no fue aprobada
            </p>
            <p class="mt-1">
              Por ahora no puedes publicar productos. Comunícate con la fundación para saber qué
              hacer.
            </p>
          </div>
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block empty:hidden' },
})
export class VerificacionBanner {
  readonly estado = input.required<EstadoVerificacion | null>();
}
