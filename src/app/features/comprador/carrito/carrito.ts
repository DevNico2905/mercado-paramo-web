import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBanknote,
  LucideCircleAlert,
  LucideLoaderCircle,
  LucideTrash2,
} from '@lucide/angular';
import { catchError, forkJoin, map, of } from 'rxjs';
import { aplicarErroresApi, leerApiError } from '../../../core/api/api-error';
import { CatalogoService } from '../../../core/api/catalogo-service';
import { Pedido } from '../../../core/api/models';
import { PedidosService } from '../../../core/api/pedidos-service';
import { AuthService } from '../../../core/auth/auth-service';
import { CartService } from '../../../core/cart/cart-service';
import { ToastService } from '../../../core/ui/toast-service';
import { CategoryArt } from '../../../shared/components/category-art/category-art';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ImpactMeter } from '../../../shared/components/impact-meter/impact-meter';
import { OrderTimeline } from '../../../shared/components/order-timeline/order-timeline';
import { QuantityStepper } from '../../../shared/components/quantity-stepper/quantity-stepper';
import { mensajeDeError } from '../../../shared/forms/errores';
import { CopPipe } from '../../../shared/pipes/cop-pipe';

const DIRECCION_MAXIMA = 200;

const MENSAJES_DIRECCION = {
  required: 'Escribe la dirección donde recibirás el pedido.',
  maxlength: `La dirección no puede tener más de ${DIRECCION_MAXIMA} caracteres.`,
};

@Component({
  selector: 'app-carrito',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CategoryArt,
    EmptyState,
    ImpactMeter,
    OrderTimeline,
    QuantityStepper,
    CopPipe,
    LucideBanknote,
    LucideCircleAlert,
    LucideLoaderCircle,
    LucideTrash2,
  ],
  templateUrl: './carrito.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrito {
  private readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);
  private readonly pedidos = inject(PedidosService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly cart = inject(CartService);

  protected readonly direccionMaxima = DIRECCION_MAXIMA;
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  /** Pedido creado: al tener valor, se muestra la pantalla de confirmación. */
  protected readonly pedidoConfirmado = signal<Pedido | null>(null);

  protected readonly formulario = new FormGroup({
    direccionEntrega: new FormControl(this.cart.direccionBorrador(), {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(DIRECCION_MAXIMA)],
    }),
  });
  protected readonly direccion = this.formulario.controls.direccionEntrega;
  private readonly direccionActual = toSignal(this.direccion.valueChanges, {
    initialValue: this.direccion.value,
  });
  protected readonly caracteres = computed(() => this.direccionActual().length);

  /** Confirmar requiere una cuenta de comprador; un visitante pasa primero por el login. */
  protected readonly rolSinCompras = computed(() => {
    const rol = this.auth.rol();
    return rol !== null && rol !== 'COMPRADOR';
  });
  protected readonly primerNombre = computed(
    () => this.cart.carrito().productorNombre.trim().split(/\s+/)[0],
  );
  /** Participación real del pedido confirmado, con los valores que devolvió la API. */
  protected readonly participacionConfirmada = computed(() => {
    const pedido = this.pedidoConfirmado();
    return pedido && pedido.total > 0 ? (pedido.montoProductor / pedido.total) * 100 : null;
  });

  constructor() {
    this.direccion.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((direccion) => this.cart.direccionBorrador.set(direccion));
  }

  protected errorDireccion(): string | null {
    return mensajeDeError(this.direccion, MENSAJES_DIRECCION);
  }

  protected confirmar(): void {
    this.errorGeneral.set(null);
    if (this.enviando() || this.cart.estaVacio() || this.rolSinCompras()) {
      return;
    }
    if (this.direccion.value.trim() === '') {
      this.direccion.setValue('');
    }
    if (this.direccion.invalid) {
      this.direccion.markAsTouched();
      return;
    }
    if (!this.auth.estaAutenticado()) {
      this.toast.info('Inicia sesión o crea tu cuenta para confirmar el pedido.');
      void this.router.navigate(['/login'], { queryParams: { redirect: '/carrito' } });
      return;
    }

    this.enviando.set(true);
    this.pedidos
      .crear({
        direccionEntrega: this.direccion.value.trim(),
        items: this.cart.items().map(({ productoId, cantidad }) => ({ productoId, cantidad })),
      })
      .subscribe({
        next: (pedido) => {
          this.enviando.set(false);
          this.pedidoConfirmado.set(pedido);
          this.cart.vaciar();
          this.direccion.reset('');
          window.scrollTo({ top: 0 });
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.manejarError(error);
        },
      });
  }

  private manejarError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorGeneral.set('No pudimos confirmar tu pedido. Intenta de nuevo.');
      return;
    }
    if (error.status === 409) {
      this.errorGeneral.set(
        leerApiError(error)?.message ?? 'Algunos productos ya no tienen suficiente stock.',
      );
      this.refrescarStock();
      return;
    }
    if ([0, 401, 403].includes(error.status) || error.status >= 500) {
      return;
    }
    this.errorGeneral.set(aplicarErroresApi(this.formulario, error));
  }

  /** Tras un 409 de stock: vuelve a consultar cada producto y ajusta el carrito. */
  private refrescarStock(): void {
    const consultas = this.cart.items().map(({ productoId }) =>
      this.catalogo.producto(productoId).pipe(
        map((producto) => ({ productoId, producto })),
        catchError((error: unknown) =>
          of({
            productoId,
            producto: null,
            retirado: error instanceof HttpErrorResponse && error.status === 404,
          }),
        ),
      ),
    );
    forkJoin(consultas).subscribe((resultados) => {
      for (const resultado of resultados) {
        if (resultado.producto) {
          this.cart.sincronizar(resultado.producto);
        } else if ('retirado' in resultado && resultado.retirado) {
          this.cart.quitar(resultado.productoId);
        }
      }
    });
  }
}
