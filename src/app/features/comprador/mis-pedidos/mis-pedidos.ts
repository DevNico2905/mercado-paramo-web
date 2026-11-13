import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  LucideChevronDown,
  LucideLoaderCircle,
  LucideMapPin,
  LucideRefreshCw,
} from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { leerApiError } from '../../../core/api/api-error';
import { Pedido } from '../../../core/api/models';
import { PedidosService } from '../../../core/api/pedidos-service';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ImpactMeter } from '../../../shared/components/impact-meter/impact-meter';
import { OrderTimeline } from '../../../shared/components/order-timeline/order-timeline';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { UnidadPipe } from '../../../shared/pipes/unidad-pipe';
import {
  ESTADOS,
  ORDENES,
  ORDEN_POR_DEFECTO,
  Orden,
  aFiltrosDeApi,
  leerFiltros,
  rangoInvalido,
} from '../../../core/api/filtros-pedidos';

type Carga = { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; pedidos: Pedido[] };

@Component({
  selector: 'app-mis-pedidos',
  imports: [
    UnidadPipe,
    DatePipe,
    RouterLink,
    CopPipe,
    EmptyState,
    ImpactMeter,
    OrderTimeline,
    Skeleton,
    StatusBadge,
    LucideDynamicIcon,
  ],
  templateUrl: './mis-pedidos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisPedidos {
  protected readonly iconos = iconos({
    LucideChevronDown,
    LucideLoaderCircle,
    LucideMapPin,
    LucideRefreshCw,
  });

  private readonly pedidosService = inject(PedidosService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Query params de la pantalla. */
  readonly estado = input<string>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  readonly orden = input<string>();

  protected readonly estados = ESTADOS;
  protected readonly ordenes = Object.entries(ORDENES).map(([valor, { etiqueta }]) => ({
    valor: valor as Orden,
    etiqueta,
  }));
  protected readonly esqueletos = [0, 1, 2];

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
  protected readonly abiertos = signal<ReadonlySet<number>>(new Set());
  /** Id del pedido que se está cancelando, para deshabilitar su botón. */
  protected readonly cancelando = signal<number | null>(null);

  constructor() {
    toObservable(this.peticion)
      .pipe(
        switchMap(({ filtros }) => {
          if (rangoInvalido(filtros)) {
            return of<Carga>({ estado: 'listo', pedidos: [] });
          }
          return this.pedidosService.misPedidos(aFiltrosDeApi(filtros)).pipe(
            map((pedidos): Carga => ({ estado: 'listo', pedidos })),
            startWith<Carga>({ estado: 'cargando' }),
            catchError(() => of<Carga>({ estado: 'error' })),
          );
        }),
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

  protected alternar(id: number): void {
    this.abiertos.update((abiertos) => {
      const nuevos = new Set(abiertos);
      if (!nuevos.delete(id)) {
        nuevos.add(id);
      }
      return nuevos;
    });
  }

  protected async cancelar(pedido: Pedido): Promise<void> {
    const confirmado = await this.confirm.confirmar({
      titulo: `¿Cancelar el pedido n.º ${pedido.id}?`,
      mensaje: `${pedido.productorNombre} ya no lo preparará. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, cancelar pedido',
      textoCancelar: 'No, conservarlo',
      peligro: true,
    });
    if (!confirmado || this.cancelando() !== null) {
      return;
    }
    this.cancelando.set(pedido.id);
    this.pedidosService.cancelar(pedido.id).subscribe({
      next: (actualizado) => {
        this.cancelando.set(null);
        this.reemplazar(actualizado);
        this.toast.exito(`Cancelaste el pedido n.º ${actualizado.id}.`);
      },
      error: (error: unknown) => {
        this.cancelando.set(null);
        if (error instanceof HttpErrorResponse && [400, 404, 409].includes(error.status)) {
          this.toast.error(leerApiError(error)?.message ?? 'No se pudo cancelar el pedido.');
          this.reintentar();
        }
      },
    });
  }

  /** Actualiza el pedido en la lista; lo saca si ya no cumple el filtro de estado. */
  private reemplazar(actualizado: Pedido): void {
    const filtroEstado = this.filtros().estado;
    this.carga.update((carga) => {
      if (carga.estado !== 'listo') {
        return carga;
      }
      const pedidos =
        filtroEstado !== null && filtroEstado !== actualizado.estado
          ? carga.pedidos.filter((pedido) => pedido.id !== actualizado.id)
          : carga.pedidos.map((pedido) => (pedido.id === actualizado.id ? actualizado : pedido));
      return { estado: 'listo', pedidos };
    });
  }
}
