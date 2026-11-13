import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideLoaderCircle, LucideMapPin, LucidePhone, LucideRefreshCw } from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { leerApiError } from '../../../core/api/api-error';
import {
  ORDENES,
  ORDEN_POR_DEFECTO,
  Orden,
  aFiltrosDeApi,
  leerFiltros,
  rangoInvalido,
} from '../../../core/api/filtros-pedidos';
import { EstadoPedido, Pedido } from '../../../core/api/models';
import { ProductorService } from '../../../core/api/productor-service';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import {
  AccionPedido,
  ESTADOS_HISTORIAL,
  PESTANAS,
  Pestana,
  accionesDelProductor,
  agruparPorPestana,
  leerPestana,
  pestanaDe,
} from './pestanas';

type Carga = { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; pedidos: Pedido[] };

const VACIOS: Record<Pestana, { emoji: string; titulo: string; mensaje: string }> = {
  'por-atender': {
    emoji: '☕',
    titulo: 'No tienes pedidos por atender',
    mensaje: 'Cuando un comprador te haga un pedido, aparecerá aquí.',
  },
  'en-curso': {
    emoji: '🧺',
    titulo: 'No tienes pedidos en curso',
    mensaje: 'Los pedidos que aceptes quedan aquí hasta que los entregues.',
  },
  historial: {
    emoji: '📒',
    titulo: 'Tu historial está vacío',
    mensaje: 'Aquí verás los pedidos entregados, rechazados y cancelados.',
  },
};

@Component({
  selector: 'app-pedidos-recibidos',
  imports: [DatePipe, RouterLink, CopPipe, EmptyState, Skeleton, StatusBadge, LucideDynamicIcon],
  templateUrl: './pedidos-recibidos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosRecibidos {
  protected readonly iconos = iconos({
    LucideLoaderCircle,
    LucideMapPin,
    LucidePhone,
    LucideRefreshCw,
  });

  private readonly productor = inject(ProductorService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Query params de la pantalla. */
  readonly pestana = input<string>();
  readonly estado = input<string>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  readonly orden = input<string>();

  protected readonly pestanas = PESTANAS;
  protected readonly estadosHistorial = ESTADOS_HISTORIAL;
  protected readonly ordenes = Object.entries(ORDENES).map(([valor, { etiqueta }]) => ({
    valor: valor as Orden,
    etiqueta,
  }));
  protected readonly esqueletos = [0, 1];
  protected readonly accionesDe = accionesDelProductor;

  protected readonly pestanaActual = computed(() => leerPestana(this.pestana()));
  protected readonly filtros = computed(() =>
    leerFiltros({
      estado: this.estado(),
      desde: this.desde(),
      hasta: this.hasta(),
      orden: this.orden(),
    }),
  );
  /** Estado elegido dentro del historial; las otras pestañas ya son un solo estado. */
  protected readonly estadoHistorial = computed(() => {
    const estado = this.filtros().estado;
    return ESTADOS_HISTORIAL.some((opcion) => opcion.valor === estado) ? estado : null;
  });
  protected readonly rangoInvalido = computed(() => rangoInvalido(this.filtros()));
  protected readonly hayFechas = computed(
    () => this.filtros().desde !== null || this.filtros().hasta !== null,
  );
  protected readonly vacio = computed(() => VACIOS[this.pestanaActual()]);

  private readonly intento = signal(0);
  /** Las pestañas y sus contadores salen de una sola consulta: solo fechas y orden van a la API. */
  private readonly peticion = computed(() => {
    const { desde, hasta, orden } = this.filtros();
    return { filtros: { estado: null, desde, hasta, orden }, intento: this.intento() };
  });

  protected readonly carga = signal<Carga>({ estado: 'cargando' });
  /** Pedido con una acción en curso, para deshabilitar sus botones. */
  protected readonly procesando = signal<number | null>(null);

  protected readonly grupos = computed(() => {
    const carga = this.carga();
    return agruparPorPestana(carga.estado === 'listo' ? carga.pedidos : []);
  });
  protected readonly visibles = computed(() => {
    const pedidos = this.grupos()[this.pestanaActual()];
    const estado = this.estadoHistorial();
    return this.pestanaActual() === 'historial' && estado
      ? pedidos.filter((pedido) => pedido.estado === estado)
      : pedidos;
  });

  constructor() {
    toObservable(this.peticion)
      .pipe(
        switchMap(({ filtros }) => {
          if (rangoInvalido(filtros)) {
            return of<Carga>({ estado: 'listo', pedidos: [] });
          }
          return this.productor.pedidosRecibidos(aFiltrosDeApi(filtros)).pipe(
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

  protected recargar(): void {
    this.intento.update((intento) => intento + 1);
  }

  protected primerNombre(nombre: string): string {
    return nombre.trim().split(/\s+/)[0];
  }

  protected async ejecutar(pedido: Pedido, accion: AccionPedido): Promise<void> {
    if (this.procesando() !== null) {
      return;
    }
    if (accion.confirmar) {
      const confirmado = await this.confirm.confirmar({
        titulo: `¿Rechazar el pedido de ${this.primerNombre(pedido.compradorNombre)}?`,
        mensaje: 'El comprador verá que no puedes atenderlo. Esta acción no se puede deshacer.',
        textoConfirmar: 'Sí, rechazar',
        textoCancelar: 'No, volver',
        peligro: true,
      });
      if (!confirmado) {
        return;
      }
    }
    this.procesando.set(pedido.id);
    this.productor.cambiarEstado(pedido.id, accion.estado).subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.reemplazar(actualizado);
        this.toast.exito(
          `${accion.hecho} el pedido n.º ${actualizado.id}. ${this.dondeQueda(actualizado.estado)}`,
        );
      },
      error: (error: unknown) => {
        this.procesando.set(null);
        if (error instanceof HttpErrorResponse && [400, 404, 409].includes(error.status)) {
          this.toast.error(
            leerApiError(error)?.message ?? 'Este pedido cambió. Revisa la lista actualizada.',
          );
          this.recargar();
        }
      },
    });
  }

  private dondeQueda(estado: EstadoPedido): string {
    const pestana = PESTANAS.find((p) => p.valor === pestanaDe(estado));
    return pestana ? `Ahora está en «${pestana.etiqueta}».` : '';
  }

  /** El pedido actualizado pasa a su nueva pestaña sin volver a consultar la lista. */
  private reemplazar(actualizado: Pedido): void {
    this.carga.update((carga) =>
      carga.estado === 'listo'
        ? {
            estado: 'listo',
            pedidos: carga.pedidos.map((p) => (p.id === actualizado.id ? actualizado : p)),
          }
        : carga,
    );
  }
}
