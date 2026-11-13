import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideEye, LucideEyeOff, LucidePencil, LucidePlus, LucideRefreshCw } from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { Producto } from '../../../core/api/models';
import { ProductorService } from '../../../core/api/productor-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { CategoryArt } from '../../../shared/components/category-art/category-art';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { UnidadPipe } from '../../../shared/pipes/unidad-pipe';

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
  imports: [UnidadPipe, RouterLink, CategoryArt, CopPipe, EmptyState, Skeleton, LucideDynamicIcon],
  templateUrl: './mis-productos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisProductos {
  protected readonly iconos = iconos({
    LucideEye,
    LucideEyeOff,
    LucidePencil,
    LucidePlus,
    LucideRefreshCw,
  });

  private readonly productor = inject(ProductorService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly stockBajo = STOCK_BAJO;
  protected readonly esqueletos = [0, 1, 2];
  protected readonly carga = signal<Carga>({ estado: 'cargando' });
  /** Id del producto que se está ocultando o mostrando, para deshabilitar sus botones. */
  protected readonly procesando = signal<number | null>(null);

  protected readonly estadoVerificacion = computed(
    () => this.auth.usuario()?.estadoVerificacion ?? null,
  );
  protected readonly verificado = computed(() => this.estadoVerificacion() === 'VERIFICADO');
  protected readonly visibles = computed(() => {
    const carga = this.carga();
    return carga.estado === 'listo' ? carga.productos.filter((p) => p.activo).length : 0;
  });

  constructor() {
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
        'Dejará de verse en el catálogo hasta que lo vuelvas a mostrar. Los pedidos que ya recibiste no cambian.',
      textoConfirmar: 'Sí, ocultar',
      textoCancelar: 'No, dejarlo',
    });
    if (!confirmado || this.procesando() !== null) {
      return;
    }
    this.procesando.set(producto.id);
    this.productor.desactivarProducto(producto.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.reemplazar({ ...producto, activo: false });
        this.toast.exito(`${producto.nombre} ya no aparece en el catálogo.`);
      },
      error: () => this.procesando.set(null),
    });
  }

  protected mostrar(producto: Producto): void {
    if (this.procesando() !== null) {
      return;
    }
    this.procesando.set(producto.id);
    this.productor.reactivarProducto(producto.id).subscribe({
      next: (actualizado) => {
        this.procesando.set(null);
        this.reemplazar(actualizado);
        this.toast.exito(`${actualizado.nombre} está de nuevo en el catálogo.`);
      },
      error: () => this.procesando.set(null),
    });
  }

  private reemplazar(actualizado: Producto): void {
    this.carga.update((carga) =>
      carga.estado === 'listo'
        ? {
            estado: 'listo',
            productos: ordenar(
              carga.productos.map((p) => (p.id === actualizado.id ? actualizado : p)),
            ),
          }
        : carga,
    );
  }
}
