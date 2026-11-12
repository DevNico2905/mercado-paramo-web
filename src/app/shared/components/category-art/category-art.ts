import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { arteDeCategoria } from './categorias';

/**
 * Arte por categoría: reemplaza a la foto del producto con un degradado, un paisaje de
 * páramo y un emoji grande. Es decorativo; el nombre de la categoría se muestra aparte.
 */
@Component({
  selector: 'app-category-art',
  templateUrl: './category-art.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class CategoryArt {
  readonly categoria = input<string | null>();
  readonly tamano = input<'tarjeta' | 'grande'>('tarjeta');

  protected readonly arte = computed(() => arteDeCategoria(this.categoria()));
}
