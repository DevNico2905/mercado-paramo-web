import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideRefreshCw } from '@lucide/icons';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminService } from '../../../core/api/admin-service';
import {
  ESTADOS,
  ORDENES,
  ORDEN_POR_DEFECTO,
  Orden,
  aFiltrosDeApi,
  leerFiltros,
  rangoInvalido,
} from '../../../core/api/filtros-pedidos';
import { Pedido } from '../../../core/api/models';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { iconos } from '../../../shared/iconos';
import { CopPipe } from '../../../shared/pipes/cop-pipe';

type Carga = { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; pedidos: Pedido[] };

/** Todos los pedidos de la plataforma. Solo lectura: la fundación observa, no cambia estados. */
@Component({
  selector: 'app-admin-pedidos',
  imports: [DatePipe, CopPipe, EmptyState, Skeleton, StatusBadge, LucideDynamicIcon],
  templateUrl: './pedidos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPedidos {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  /** Query params de la pantalla (SPEC 5.1). */
  readonly estado = input<string>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  readonly orden = input<string>();

  protected readonly iconos = iconos({ LucideRefreshCw });
  protected readonly estados = ESTADOS;
  protected readonly ordenes = Object.entries(ORDENES).map(([valor, { etiqueta }]) => ({
    valor: valor as Orden,
    etiqueta,
  }));
  protected readonly esqueletos = [0, 1, 2, 3, 4];

  protected readonly filtros = computed(() =>
    leerFiltros({
      estado: this.estado(),
      desde: this.desde(),
      hasta: this.hasta(),
      orden: this.orden(),
    }),
  );
  protected readonly rangoInvalido = computed(() => rangoInvalido(this.filtros()));
  protected readonly hayFiltros = computed(() => {
    const { estado, desde, hasta } = this.filtros();
    return estado !== null || desde !== null || hasta !== null;
  });

  private readonly intento = signal(0);
  private readonly peticion = computed(() => ({
    filtros: this.filtros(),
    intento: this.intento(),
  }));
  protected readonly carga = signal<Carga>({ estado: 'cargando' });

  protected readonly resumen = computed(() => {
    const carga = this.carga();
    const pedidos = carga.estado === 'listo' ? carga.pedidos : [];
    return {
      cantidad: pedidos.length,
      total: pedidos.reduce((suma, pedido) => suma + pedido.total, 0),
    };
  });

  constructor() {
    toObservable(this.peticion)
      .pipe(
        switchMap(({ filtros }) =>
          rangoInvalido(filtros)
            ? of<Carga>({ estado: 'listo', pedidos: [] })
            : this.admin.pedidos(aFiltrosDeApi(filtros)).pipe(
                map((pedidos): Carga => ({ estado: 'listo', pedidos })),
                startWith<Carga>({ estado: 'cargando' }),
                catchError(() => of<Carga>({ estado: 'error' })),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((carga) => this.carga.set(carga));
  }

  protected filtrar(cambios: Record<string, string | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }

  protected ordenar(orden: string): void {
    this.filtrar({ orden: orden === ORDEN_POR_DEFECTO ? null : orden });
  }

  protected limpiarFiltros(): void {
    this.filtrar({ estado: null, desde: null, hasta: null });
  }

  protected reintentar(): void {
    this.intento.update((intento) => intento + 1);
  }
}
