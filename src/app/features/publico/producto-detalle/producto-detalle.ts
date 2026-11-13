import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  LucideArrowLeft,
  LucideMapPin,
  LucideRefreshCw,
  LucideShoppingBasket,
} from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoService } from '../../../core/api/catalogo-service';
import { Producto } from '../../../core/api/models';
import { AgregarAlCarrito } from '../../../core/cart/agregar-al-carrito';
import { CartService } from '../../../core/cart/cart-service';
import { CategoryArt } from '../../../shared/components/category-art/category-art';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ImpactMeter } from '../../../shared/components/impact-meter/impact-meter';
import { QuantityStepper } from '../../../shared/components/quantity-stepper/quantity-stepper';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { UnidadPipe } from '../../../shared/pipes/unidad-pipe';

type Carga =
  | { estado: 'cargando' }
  | { estado: 'no-disponible' }
  | { estado: 'error' }
  | { estado: 'listo'; producto: Producto };

const STOCK_BAJO = 5;

@Component({
  selector: 'app-producto-detalle',
  imports: [
    UnidadPipe,
    RouterLink,
    CategoryArt,
    EmptyState,
    ImpactMeter,
    QuantityStepper,
    Skeleton,
    CopPipe,
    LucideDynamicIcon,
  ],
  templateUrl: './producto-detalle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetalle {
  protected readonly iconos = iconos({
    LucideArrowLeft,
    LucideMapPin,
    LucideRefreshCw,
    LucideShoppingBasket,
  });

  private readonly catalogo = inject(CatalogoService);
  protected readonly cart = inject(CartService);
  protected readonly agregarAlCarrito = inject(AgregarAlCarrito);

  /** Parámetro de ruta `:id`. */
  readonly id = input.required<string>();

  private readonly intento = signal(0);
  private readonly peticion = computed(() => ({ id: this.id(), intento: this.intento() }));

  protected readonly carga = toSignal(
    toObservable(this.peticion).pipe(
      switchMap(({ id }) => {
        const numero = Number(id);
        if (!Number.isInteger(numero) || numero < 1) {
          return of<Carga>({ estado: 'no-disponible' });
        }
        return this.catalogo.producto(numero).pipe(
          map((producto): Carga =>
            producto.activo ? { estado: 'listo', producto } : { estado: 'no-disponible' },
          ),
          startWith<Carga>({ estado: 'cargando' }),
          catchError((error: unknown) =>
            of<Carga>({
              estado:
                error instanceof HttpErrorResponse && error.status === 404
                  ? 'no-disponible'
                  : 'error',
            }),
          ),
        );
      }),
    ),
    { initialValue: { estado: 'cargando' } as Carga },
  );

  protected readonly producto = computed(() => {
    const carga = this.carga();
    return carga.estado === 'listo' ? carga.producto : null;
  });

  /** Cantidad elegida; vuelve a 1 cuando cambia el producto. */
  protected readonly cantidad = linkedSignal({
    source: () => this.producto()?.id,
    computation: () => 1,
  });

  protected readonly agotado = computed(() => (this.producto()?.stock ?? 0) < 1);
  protected readonly stockBajo = computed(
    () => !this.agotado() && (this.producto()?.stock ?? 0) <= STOCK_BAJO,
  );
  protected readonly subtotal = computed(() => (this.producto()?.precio ?? 0) * this.cantidad());
  protected readonly inicialProductor = computed(
    () => this.producto()?.productorNombre.trim().charAt(0).toUpperCase() ?? '',
  );

  protected async agregar(producto: Producto): Promise<void> {
    const agregado = await this.agregarAlCarrito.ejecutar(producto, this.cantidad());
    if (agregado) {
      this.cantidad.set(1);
    }
  }

  protected reintentar(): void {
    this.intento.update((intento) => intento + 1);
  }
}
