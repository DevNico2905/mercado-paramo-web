import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideEyeOff, LucidePencil, LucidePlus, LucideRefreshCw } from '@lucide/angular';
import { Producto } from '../../../core/api/models';
import { ProductorService } from '../../../core/api/productor-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { CategoryArt } from '../../../shared/components/category-art/category-art';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { VerificacionBanner } from '../../../shared/components/verificacion-banner/verificacion-banner';
import { CopPipe } from '../../../shared/pipes/cop-pipe';

type Carga =
  { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; productos: Producto[] };

const STOCK_BAJO = 5;

/** Visibles primero; dentro de cada grupo, por nombre. */
function ordenar(productos: Producto[]): Producto[] {
  return [...productos].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

@Component({
  selector: 'app-mis-productos',
  imports: [
    RouterLink,
    CategoryArt,
    CopPipe,
    EmptyState,
    Skeleton,
    VerificacionBanner,
    LucideEyeOff,
    LucidePencil,
    LucidePlus,
    LucideRefreshCw,
  ],
  templateUrl: './mis-productos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisProductos {
  private readonly productor = inject(ProductorService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly stockBajo = STOCK_BAJO;
  protected readonly esqueletos = [0, 1, 2];
  protected readonly carga = signal<Carga>({ estado: 'cargando' });
  /** Id del producto que se está ocultando, para deshabilitar su botón. */
  protected readonly ocultando = signal<number | null>(null);

  protected readonly estadoVerificacion = computed(
    () => this.auth.usuario()?.estadoVerificacion ?? null,
  );
  protected readonly verificado = computed(() => this.estadoVerificacion() === 'VERIFICADO');
  protected readonly visibles = computed(() => {
    const carga = this.carga();
    return carga.estado === 'listo' ? carga.productos.filter((p) => p.activo).length : 0;
  });

  constructor() {
    this.auth.cargarPerfil().subscribe({ error: () => undefined });
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set({ estado: 'cargando' });
    this.productor.misProductos().subscribe({
      next: (productos) => this.carga.set({ estado: 'listo', productos: ordenar(productos) }),
      error: () => this.carga.set({ estado: 'error' }),
    });
  }

  protected async ocultar(producto: Producto): Promise<void> {
    const confirmado = await this.confirm.confirmar({
      titulo: `¿Ocultar ${producto.nombre}?`,
      mensaje:
        'Los compradores ya no lo verán en el catálogo. Desde la aplicación no se puede volver a mostrar.',
      textoConfirmar: 'Sí, ocultar',
      textoCancelar: 'No, dejarlo',
      peligro: true,
    });
    if (!confirmado || this.ocultando() !== null) {
      return;
    }
    this.ocultando.set(producto.id);
    this.productor.desactivarProducto(producto.id).subscribe({
      next: () => {
        this.ocultando.set(null);
        this.carga.update((carga) =>
          carga.estado === 'listo'
            ? {
                estado: 'listo',
                productos: ordenar(
                  carga.productos.map((p) => (p.id === producto.id ? { ...p, activo: false } : p)),
                ),
              }
            : carga,
        );
        this.toast.exito(`${producto.nombre} ya no aparece en el catálogo.`);
      },
      error: () => this.ocultando.set(null),
    });
  }
}
