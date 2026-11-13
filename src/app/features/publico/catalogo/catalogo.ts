import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideRefreshCw } from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { Observable, catchError, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { CatalogoService } from '../../../core/api/catalogo-service';
import { Producto } from '../../../core/api/models';
import { AgregarAlCarrito } from '../../../core/cart/agregar-al-carrito';
import { CartService } from '../../../core/cart/cart-service';
import { PARTICIPACION_CON_INTERMEDIARIOS } from '../../../core/impacto';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

interface OpcionProductor {
  id: number;
  nombre: string;
  vereda: string;
}

type Carga =
  { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; productos: Producto[] };

function aId(valor: string | undefined): number | null {
  const numero = Number(valor);
  return valor && Number.isInteger(numero) && numero > 0 ? numero : null;
}

function productoresDe(productos: Producto[]): OpcionProductor[] {
  const porId = new Map<number, OpcionProductor>();
  for (const { productorId, productorNombre, vereda } of productos) {
    porId.set(productorId, { id: productorId, nombre: productorNombre, vereda });
  }
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, ProductCard, EmptyState, Skeleton, LucideDynamicIcon],
  templateUrl: './catalogo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalogo {
  protected readonly iconos = iconos({ LucideRefreshCw });

  private readonly catalogo = inject(CatalogoService);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);
  protected readonly agregarAlCarrito = inject(AgregarAlCarrito);

  /** Query param `?categoria=`: id de la categoría seleccionada. */
  readonly categoria = input<string>();
  /** Query param `?productor=`: id del productor seleccionado. */
  readonly productor = input<string>();

  protected readonly intermediarios = PARTICIPACION_CON_INTERMEDIARIOS;
  protected readonly esqueletos = [0, 1, 2, 3, 4, 5, 6, 7];

  protected readonly categoriaId = computed(() => aId(this.categoria()));
  protected readonly productorId = computed(() => aId(this.productor()));
  protected readonly hayFiltros = computed(
    () => this.categoriaId() !== null || this.productorId() !== null,
  );

  protected readonly categorias = toSignal(
    this.catalogo.categorias().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly categoriaActual = computed(
    () => this.categorias().find((categoria) => categoria.id === this.categoriaId()) ?? null,
  );

  /** Productores con productos publicados; salen del catálogo completo, sin filtros. */
  protected readonly productores = signal<OpcionProductor[]>([]);
  private readonly intento = signal(0);
  private todos$ = this.pedirTodos();

  private readonly filtros = computed(() => ({
    categoriaId: this.categoriaId(),
    productorId: this.productorId(),
    intento: this.intento(),
  }));

  protected readonly carga = toSignal(
    toObservable(this.filtros).pipe(
      switchMap(({ categoriaId, productorId }) => {
        const sinFiltros = categoriaId === null && productorId === null;
        const peticion = sinFiltros
          ? this.todos$
          : this.catalogo.productos({ categoriaId, productorId });
        return peticion.pipe(
          map((productos): Carga => ({ estado: 'listo', productos })),
          startWith<Carga>({ estado: 'cargando' }),
          catchError(() => of<Carga>({ estado: 'error' })),
        );
      }),
    ),
    { initialValue: { estado: 'cargando' } as Carga },
  );

  constructor() {
    this.todos$.subscribe({ error: () => undefined });
  }

  protected elegirProductor(valor: string): void {
    void this.router.navigate([], {
      queryParams: { productor: valor || null },
      queryParamsHandling: 'merge',
    });
  }

  protected reintentar(): void {
    this.todos$ = this.pedirTodos();
    this.intento.update((intento) => intento + 1);
  }

  private pedirTodos(): Observable<Producto[]> {
    return this.catalogo.productos().pipe(
      tap((productos) => this.productores.set(productoresDe(productos))),
      shareReplay(1),
    );
  }
}
