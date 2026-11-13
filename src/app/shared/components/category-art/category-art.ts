import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { arteDeCategoria } from './categorias';

type Tamano = 'miniatura' | 'tarjeta' | 'grande';

/**
 * Arte por categoría: reemplaza a la foto del producto con un degradado, un paisaje de
 * páramo y un grupo de emojis de la categoría. Es decorativo; el nombre de la categoría se
 * muestra aparte.
 */
@Component({
  selector: 'app-category-art',
  templateUrl: './category-art.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class CategoryArt {
  readonly categoria = input<string | null>();
  readonly tamano = input<Tamano>('tarjeta');

  protected readonly halo = { miniatura: 'size-10', tarjeta: 'size-28', grande: 'size-56' };
  /** Animación y solapamiento del grupo de emojis. */
  protected readonly grupo = {
    miniatura: '-space-x-1',
    tarjeta: '-space-x-3',
    grande: '-space-x-5 motion-safe:animate-flotar sm:-space-x-6',
  };
  /** Tamaño del emoji cuando la categoría tiene uno solo. */
  private readonly unico = {
    miniatura: 'text-3xl',
    tarjeta: 'text-6xl',
    grande: 'text-[7rem] sm:text-[9rem]',
  };
  /** Tamaño del emoji central (o de ambos, si son dos). */
  private readonly principal = {
    miniatura: 'text-2xl',
    tarjeta: 'text-5xl',
    grande: 'text-[5.5rem] sm:text-[7rem]',
  };
  /** Tamaño de los emojis laterales, un poco más pequeños y detrás del central. */
  private readonly secundario = {
    miniatura: 'text-base',
    tarjeta: 'text-4xl',
    grande: 'text-[4rem] sm:text-[5rem]',
  };

  protected readonly arte = computed(() => arteDeCategoria(this.categoria()));

  /** Clases de cada emoji según su posición en el grupo. */
  protected readonly emojis = computed(() => {
    const tamano = this.tamano();
    const emojis = this.arte().emojis;
    return emojis.map((emoji, i) => {
      if (emojis.length === 1) return { emoji, clases: this.unico[tamano] };
      if (emojis.length === 3 && i !== 1) {
        const giro = i === 0 ? '-rotate-12' : 'rotate-12';
        return { emoji, clases: `${this.secundario[tamano]} ${giro}` };
      }
      return { emoji, clases: `relative z-10 ${this.principal[tamano]}` };
    });
  });
}
