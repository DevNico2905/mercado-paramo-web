import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pantalla provisional: se reemplaza por la pantalla real en su fase (SPEC sección 12). */
@Component({
  selector: 'app-pantalla-provisional',
  template: `<h1 class="text-3xl font-semibold sm:text-4xl">{{ titulo() }}</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaProvisional {
  readonly titulo = input.required<string>();
}
