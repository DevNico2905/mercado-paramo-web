import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideRefreshCw } from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ReporteVentas as Reporte } from '../../../core/api/models';
import { ProductorService } from '../../../core/api/productor-service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ImpactMeter } from '../../../shared/components/impact-meter/impact-meter';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { RANGOS, fechaLocal, fechasDe, leerRango } from './rangos';

type Carga =
  | { estado: 'cargando' }
  | { estado: 'incompleto' }
  | { estado: 'error' }
  | { estado: 'listo'; reporte: Reporte };

@Component({
  selector: 'app-reporte-ventas',
  imports: [DatePipe, RouterLink, CopPipe, EmptyState, ImpactMeter, Skeleton, LucideDynamicIcon],
  templateUrl: './reporte-ventas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteVentas {
  protected readonly iconos = iconos({ LucideRefreshCw });

  private readonly productor = inject(ProductorService);
  private readonly router = inject(Router);

  /** Query params de la pantalla. */
  readonly rango = input<string>();
  readonly desde = input<string>();
  readonly hasta = input<string>();

  protected readonly rangos = RANGOS;
  protected readonly hoy = fechaLocal(new Date());
  protected readonly rangoActual = computed(() => leerRango(this.rango()));
  private readonly fechas = computed(() =>
    fechasDe(this.rangoActual(), new Date(), { desde: this.desde(), hasta: this.hasta() }),
  );

  private readonly intento = signal(0);
  private readonly peticion = computed(() => ({ fechas: this.fechas(), intento: this.intento() }));

  protected readonly carga = signal<Carga>({ estado: 'cargando' });

  /** Ventas por producto, de mayor a menor, con el ancho relativo de cada barra. */
  protected readonly productos = computed(() => {
    const carga = this.carga();
    if (carga.estado !== 'listo') {
      return [];
    }
    const ordenados = [...carga.reporte.productos].sort((a, b) => b.totalVendido - a.totalVendido);
    const maximo = ordenados[0]?.totalVendido ?? 0;
    return ordenados.map((venta) => ({
      ...venta,
      ancho: maximo > 0 ? Math.max(2, (venta.totalVendido / maximo) * 100) : 0,
    }));
  });

  constructor() {
    toObservable(this.peticion)
      .pipe(
        switchMap(({ fechas }) =>
          fechas === null
            ? of<Carga>({ estado: 'incompleto' })
            : this.productor.reporteVentas(fechas).pipe(
                map((reporte): Carga => ({ estado: 'listo', reporte })),
                startWith<Carga>({ estado: 'cargando' }),
                catchError(() => of<Carga>({ estado: 'error' })),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((carga) => this.carga.set(carga));
  }

  protected elegirFecha(campo: 'desde' | 'hasta', valor: string): void {
    void this.router.navigate([], {
      queryParams: { rango: 'personalizado', [campo]: valor || null },
      queryParamsHandling: 'merge',
    });
  }

  protected recargar(): void {
    this.intento.update((intento) => intento + 1);
  }
}
