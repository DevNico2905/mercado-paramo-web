import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideRefreshCw } from '@lucide/icons';
import { AdminService } from '../../../core/api/admin-service';
import { Impacto as DatosImpacto } from '../../../core/api/models';
import { PARTICIPACION_CON_INTERMEDIARIOS } from '../../../core/impacto';
import { CifraAnimada } from '../../../shared/components/cifra-animada/cifra-animada';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ImpactMeter } from '../../../shared/components/impact-meter/impact-meter';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { iconos } from '../../../shared/iconos';
import { CopPipe } from '../../../shared/pipes/cop-pipe';

type Carga =
  { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; impacto: DatosImpacto };

/** Indicador de impacto de la plataforma: la pantalla protagonista de la sustentación. */
@Component({
  selector: 'app-impacto',
  imports: [
    RouterLink,
    CifraAnimada,
    CopPipe,
    EmptyState,
    ImpactMeter,
    Skeleton,
    LucideDynamicIcon,
  ],
  templateUrl: './impacto.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Impacto {
  private readonly admin = inject(AdminService);

  protected readonly iconos = iconos({ LucideRefreshCw });
  protected readonly intermediarios = PARTICIPACION_CON_INTERMEDIARIOS;
  protected readonly carga = signal<Carga>({ estado: 'cargando' });

  /** Ejemplo concreto para la sustentación: lo que llega al productor de cada $100.000. */
  protected readonly ejemplo = 100_000;

  /** Anillos del titular: participación real frente al rango con intermediarios. */
  protected readonly anillos = computed(() => {
    const carga = this.carga();
    const porcentaje = carga.estado === 'listo' ? (carga.impacto.participacionPorcentaje ?? 0) : 0;
    const exterior = 2 * Math.PI * 84;
    const interior = 2 * Math.PI * 60;
    const { minimo, maximo } = this.intermediarios;
    return {
      exterior: `${(exterior * Math.min(100, porcentaje)) / 100} ${exterior}`,
      interiorMinimo: `${(interior * minimo) / 100} ${interior}`,
      interiorRango: `${(interior * (maximo - minimo)) / 100} ${interior}`,
      interiorDesfase: -(interior * minimo) / 100,
    };
  });

  /**
   * Cuánto más recibieron los productores frente al mejor caso con intermediarios (25 %).
   * Se calcula sobre el total vendido que reporta la API.
   */
  protected readonly diferencia = computed(() => {
    const carga = this.carga();
    if (carga.estado !== 'listo') {
      return 0;
    }
    const { totalVendido, recibidoPorProductores } = carga.impacto;
    const mejorCaso = Math.round((totalVendido * this.intermediarios.maximo) / 100);
    return Math.max(0, recibidoPorProductores - mejorCaso);
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set({ estado: 'cargando' });
    this.admin.impacto().subscribe({
      next: (impacto) => this.carga.set({ estado: 'listo', impacto }),
      error: () => this.carga.set({ estado: 'error' }),
    });
  }
}
