import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideMail, LucideMapPin, LucidePhone, LucideRefreshCw } from '@lucide/icons';
import { leerApiError } from '../../../core/api/api-error';
import { AdminService, DecisionVerificacion } from '../../../core/api/admin-service';
import { EstadoVerificacion, Productor } from '../../../core/api/models';
import { iniciales, primerNombre } from '../../../core/auth/rol';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { iconos } from '../../../shared/iconos';

type Carga =
  { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; productores: Productor[] };

export const PESTANAS_VERIFICACION: readonly {
  valor: EstadoVerificacion;
  ruta: string;
  etiqueta: string;
}[] = [
  { valor: 'PENDIENTE', ruta: 'pendientes', etiqueta: 'Pendientes' },
  { valor: 'VERIFICADO', ruta: 'verificados', etiqueta: 'Verificados' },
  { valor: 'RECHAZADO', ruta: 'rechazados', etiqueta: 'Rechazados' },
];

export function leerPestanaVerificacion(valor: string | undefined): EstadoVerificacion {
  return PESTANAS_VERIFICACION.find((p) => p.ruta === valor)?.valor ?? 'PENDIENTE';
}

const VACIOS: Record<EstadoVerificacion, { emoji: string; titulo: string; mensaje: string }> = {
  PENDIENTE: {
    emoji: '🎉',
    titulo: 'Todos los productores están al día',
    mensaje: 'No hay solicitudes esperando revisión. Cuando alguien se registre, aparecerá aquí.',
  },
  VERIFICADO: {
    emoji: '🌱',
    titulo: 'Aún no hay productores verificados',
    mensaje: 'Los productores que apruebes aparecerán aquí.',
  },
  RECHAZADO: {
    emoji: '📂',
    titulo: 'No hay productores rechazados',
    mensaje: 'Las solicitudes que no apruebes quedarán aquí.',
  },
};

@Component({
  selector: 'app-productores',
  imports: [RouterLink, EmptyState, Skeleton, StatusBadge, LucideDynamicIcon],
  templateUrl: './productores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Productores {
  private readonly admin = inject(AdminService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** Query param `?pestana=`: pendientes (por defecto), verificados o rechazados. */
  readonly pestana = input<string>();

  protected readonly iconos = iconos({ LucideMail, LucideMapPin, LucidePhone, LucideRefreshCw });
  protected readonly pestanas = PESTANAS_VERIFICACION;
  protected readonly esqueletos = [0, 1, 2];
  protected readonly iniciales = iniciales;

  protected readonly carga = signal<Carga>({ estado: 'cargando' });
  /** Productor con una decisión en curso, para deshabilitar sus botones. */
  protected readonly procesando = signal<number | null>(null);

  protected readonly estadoActual = computed(() => leerPestanaVerificacion(this.pestana()));
  protected readonly vacio = computed(() => VACIOS[this.estadoActual()]);
  protected readonly conteo = computed(() => {
    const conteo: Record<EstadoVerificacion, number> = {
      PENDIENTE: 0,
      VERIFICADO: 0,
      RECHAZADO: 0,
    };
    const carga = this.carga();
    if (carga.estado === 'listo') {
      for (const productor of carga.productores) {
        conteo[productor.estadoVerificacion]++;
      }
    }
    return conteo;
  });
  protected readonly visibles = computed(() => {
    const carga = this.carga();
    return carga.estado === 'listo'
      ? carga.productores.filter((p) => p.estadoVerificacion === this.estadoActual())
      : [];
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set({ estado: 'cargando' });
    this.admin.productores().subscribe({
      next: (productores) =>
        this.carga.set({
          estado: 'listo',
          productores: [...productores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        }),
      error: () => this.carga.set({ estado: 'error' }),
    });
  }

  protected async decidir(productor: Productor, decision: DecisionVerificacion): Promise<void> {
    if (this.procesando() !== null) {
      return;
    }
    const nombre = primerNombre(productor.nombre);
    const verificar = decision === 'VERIFICADO';
    const confirmado = await this.confirm.confirmar(
      verificar
        ? {
            titulo: `¿Verificar a ${productor.nombre}?`,
            mensaje: `${nombre} podrá publicar sus productos en el catálogo y recibir pedidos.`,
            textoConfirmar: 'Sí, verificar',
            textoCancelar: 'Todavía no',
          }
        : {
            titulo: `¿Rechazar a ${productor.nombre}?`,
            mensaje: `${nombre} no podrá publicar productos. Esta decisión no se puede cambiar desde la aplicación.`,
            textoConfirmar: 'Sí, rechazar',
            textoCancelar: 'Todavía no',
            peligro: true,
          },
    );
    if (!confirmado) {
      return;
    }
    this.procesando.set(productor.id);
    this.admin.verificar(productor.id, decision).subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.carga.update((carga) =>
          carga.estado === 'listo'
            ? {
                estado: 'listo',
                productores: carga.productores.map((p) =>
                  p.id === actualizado.id ? actualizado : p,
                ),
              }
            : carga,
        );
        this.toast.exito(
          verificar
            ? `Verificaste a ${actualizado.nombre}. Ya puede publicar.`
            : `Rechazaste la solicitud de ${actualizado.nombre}.`,
        );
      },
      error: (error: unknown) => {
        this.procesando.set(null);
        if (error instanceof HttpErrorResponse && [400, 404, 409].includes(error.status)) {
          this.toast.error(
            leerApiError(error)?.message ?? 'Este productor cambió. Revisa la lista actualizada.',
          );
          this.cargar();
        }
      },
    });
  }
}
