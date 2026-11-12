import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Bloque de carga. El tamaño y la forma se definen con clases en el propio elemento. */
@Component({
  selector: 'app-skeleton',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block rounded-lg bg-musgo-900/10 motion-safe:animate-pulse',
    'aria-hidden': 'true',
  },
})
export class Skeleton {}
