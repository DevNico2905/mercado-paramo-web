import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideCircleAlert, LucideLoaderCircle } from '@lucide/angular';
import { catchError, of } from 'rxjs';
import { aplicarErroresApi } from '../../../core/api/api-error';
import { CatalogoService } from '../../../core/api/catalogo-service';
import { Producto, ProductoRequest } from '../../../core/api/models';
import { ProductorService } from '../../../core/api/productor-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ToastService } from '../../../core/ui/toast-service';
import { arteDeCategoria } from '../../../shared/components/category-art/categorias';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import {
  ProductCard,
  ProductoDeTarjeta,
} from '../../../shared/components/product-card/product-card';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { VerificacionBanner } from '../../../shared/components/verificacion-banner/verificacion-banner';
import { MensajesDeError, mensajeDeError } from '../../../shared/forms/errores';

export const UNIDADES_SUGERIDAS = ['libra', 'kilo', 'unidad', 'litro', 'docena', 'atado'];

type Campo = 'nombre' | 'unidad' | 'precio' | 'stock' | 'categoriaId';

const MENSAJES: Record<Campo, MensajesDeError> = {
  nombre: {
    required: 'Escribe el nombre del producto.',
    maxlength: 'El nombre puede tener hasta 100 letras.',
  },
  unidad: {
    required: 'Elige o escribe cómo lo vendes.',
    maxlength: 'La unidad puede tener hasta 20 letras.',
  },
  precio: {
    required: 'Escribe el precio.',
    entero: 'Escribe el precio en pesos, sin puntos ni centavos.',
    min: 'El precio debe ser mayor que cero.',
  },
  stock: {
    required: 'Escribe cuántos tienes.',
    entero: 'Escribe un número entero, sin puntos.',
    min: 'La cantidad no puede ser negativa.',
  },
  categoriaId: { required: 'Elige una categoría.' },
};

function entero(control: AbstractControl<number | null>): ValidationErrors | null {
  const valor = control.value;
  return valor === null || Number.isInteger(valor) ? null : { entero: true };
}

type Carga = { estado: 'cargando' } | { estado: 'no-existe' } | { estado: 'listo' };

@Component({
  selector: 'app-producto-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyState,
    ProductCard,
    Skeleton,
    VerificacionBanner,
    LucideArrowLeft,
    LucideCircleAlert,
    LucideLoaderCircle,
  ],
  templateUrl: './producto-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoForm implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productor = inject(ProductorService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Parámetro de ruta `:id`: presente al editar, ausente al crear. */
  readonly id = input<string>();

  protected readonly unidades = UNIDADES_SUGERIDAS;
  protected readonly esEdicion = computed(() => this.id() !== undefined);

  protected readonly categorias = toSignal(
    inject(CatalogoService)
      .categorias()
      .pipe(catchError(() => of([]))),
  );
  protected readonly opcionesCategoria = computed(() =>
    (this.categorias() ?? []).map((categoria) => ({
      ...categoria,
      emoji: arteDeCategoria(categoria.nombre).emoji,
    })),
  );

  protected readonly carga = signal<Carga>({ estado: 'cargando' });
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  /** La vereda no está en el perfil: se toma de los productos ya publicados. */
  private readonly vereda = signal('');

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    unidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    precio: new FormControl<number | null>(null, [Validators.required, entero, Validators.min(1)]),
    stock: new FormControl<number | null>(null, [Validators.required, entero, Validators.min(0)]),
    categoriaId: new FormControl<number | null>(null, [Validators.required]),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly estadoVerificacion = computed(
    () => this.auth.usuario()?.estadoVerificacion ?? null,
  );
  /** Solo un productor verificado puede publicar productos nuevos. */
  protected readonly bloqueado = computed(
    () => !this.esEdicion() && this.estadoVerificacion() !== 'VERIFICADO',
  );

  /** Vista previa en vivo: así se verá la tarjeta en el catálogo. */
  protected readonly vistaPrevia = computed<ProductoDeTarjeta>(() => {
    const { nombre, unidad, precio, stock, categoriaId } = this.valores();
    const categoria = this.categorias()?.find((c) => c.id === categoriaId);
    return {
      nombre: nombre?.trim() || 'Nombre del producto',
      unidad: unidad?.trim() || 'unidad',
      precio: typeof precio === 'number' && precio > 0 ? precio : 0,
      stock: typeof stock === 'number' && stock >= 0 ? Math.floor(stock) : 0,
      categoriaNombre: categoria?.nombre ?? 'Categoría',
      productorNombre: this.auth.usuario()?.nombre ?? '',
      vereda: this.vereda(),
    };
  });

  /** Los inputs de ruta (`id`) ya están disponibles aquí, no en el constructor. */
  ngOnInit(): void {
    this.productor
      .misProductos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          this.vereda.set(productos[0]?.vereda ?? '');
          const id = this.id();
          if (id === undefined) {
            this.carga.set({ estado: 'listo' });
            return;
          }
          const producto = productos.find((p) => p.id === Number(id));
          if (producto) {
            this.rellenar(producto);
            this.carga.set({ estado: 'listo' });
          } else {
            this.carga.set({ estado: 'no-existe' });
          }
        },
        error: () =>
          this.carga.set(this.id() === undefined ? { estado: 'listo' } : { estado: 'no-existe' }),
      });
  }

  protected errorDe(campo: Campo): string | null {
    return mensajeDeError(this.formulario.controls[campo], MENSAJES[campo]);
  }

  protected elegirUnidad(unidad: string): void {
    const control = this.formulario.controls.unidad;
    control.setValue(unidad);
    control.markAsTouched();
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    if (this.enviando() || this.bloqueado()) {
      return;
    }
    const { nombre, unidad } = this.formulario.controls;
    nombre.setValue(nombre.value.trim());
    unidad.setValue(unidad.value.trim());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { precio, stock, categoriaId } = this.formulario.getRawValue();
    if (precio === null || stock === null || categoriaId === null) {
      return;
    }
    const datos: ProductoRequest = {
      nombre: nombre.value,
      unidad: unidad.value,
      precio,
      stock,
      categoriaId,
    };
    const id = this.id();
    const peticion =
      id === undefined
        ? this.productor.crearProducto(datos)
        : this.productor.actualizarProducto(Number(id), datos);

    this.enviando.set(true);
    peticion.subscribe({
      next: (producto) => {
        this.toast.exito(
          id === undefined
            ? `¡Listo! ${producto.nombre} ya está en el catálogo.`
            : `Guardaste los cambios de ${producto.nombre}.`,
        );
        void this.router.navigateByUrl('/productor/productos');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        if (!(error instanceof HttpErrorResponse)) {
          this.errorGeneral.set('No pudimos guardar el producto. Intenta de nuevo.');
        } else if (![0, 401, 403].includes(error.status) && error.status < 500) {
          this.errorGeneral.set(aplicarErroresApi(this.formulario, error));
        }
      },
    });
  }

  private rellenar(producto: Producto): void {
    this.formulario.setValue({
      nombre: producto.nombre,
      unidad: producto.unidad,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId,
    });
  }
}
