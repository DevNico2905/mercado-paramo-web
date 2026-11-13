import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideMapPin, LucidePlus } from '@lucide/icons';
import { iconos } from '../../iconos';
import { Producto } from '../../../core/api/models';
import { CopPipe } from '../../pipes/cop-pipe';
import { CategoryArt } from '../category-art/category-art';
import { UnidadPipe } from '../../pipes/unidad-pipe';

/** Datos que muestra la tarjeta. Sin `id` no enlaza al detalle (vista previa del formulario). */
export type ProductoDeTarjeta = Pick<
  Producto,
  'nombre' | 'unidad' | 'precio' | 'stock' | 'categoriaNombre' | 'productorNombre' | 'vereda'
> & { id?: number };

const STOCK_BAJO = 5;

@Component({
  selector: 'app-product-card',
  imports: [UnidadPipe, RouterLink, CategoryArt, CopPipe, LucideDynamicIcon],
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class ProductCard {
  protected readonly iconos = iconos({ LucideMapPin, LucidePlus });

  readonly producto = input.required<ProductoDeTarjeta>();
  readonly mostrarAgregar = input(true);
  /** Unidades de este producto que ya están en el carrito. */
  readonly enCarrito = input(0);
  readonly agregar = output<void>();

  protected readonly agotado = computed(() => this.producto().stock < 1);
  protected readonly stockBajo = computed(
    () => !this.agotado() && this.producto().stock <= STOCK_BAJO,
  );
}
