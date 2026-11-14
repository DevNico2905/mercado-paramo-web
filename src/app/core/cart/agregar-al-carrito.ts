import { Injectable, computed, inject } from '@angular/core';
import { Producto } from '../api/models';
import { AuthService } from '../auth/auth-service';
import { ConfirmService } from '../ui/confirm-service';
import { ToastService } from '../ui/toast-service';
import { pluralizarUnidad } from '../../shared/pipes/unidad-pipe';
import { CANTIDAD_MAXIMA_POR_PRODUCTO, CartService } from './cart-service';

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0];

/**
 * Acción "Agregar al carrito" tal como la ve el usuario: aplica la regla de un solo
 * productor con su diálogo de confirmación y avisa el resultado con un toast.
 */
@Injectable({ providedIn: 'root' })
export class AgregarAlCarrito {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** El botón "Agregar" no se muestra con sesión de PRODUCTOR o ADMIN. */
  readonly disponible = computed(() => {
    const rol = this.auth.rol();
    return rol === null || rol === 'COMPRADOR';
  });

  async ejecutar(producto: Producto, cantidad = 1): Promise<boolean> {
    let resultado = this.cart.agregar(producto, cantidad);

    if (resultado === 'otro-productor') {
      const actual = primerNombre(this.cart.carrito().productorNombre);
      const nuevo = primerNombre(producto.productorNombre);
      const aceptado = await this.confirm.confirmar({
        titulo: 'Un pedido, un productor',
        mensaje: `Tu carrito tiene productos de ${actual}. Un pedido solo puede ser de un productor. ¿Vaciar el carrito y agregar este producto de ${nuevo}?`,
        textoConfirmar: 'Vaciar y agregar',
        textoCancelar: 'Conservar mi carrito',
      });
      if (!aceptado) {
        return false;
      }
      resultado = this.cart.reemplazarCon(producto, cantidad);
    }

    switch (resultado) {
      case 'agregado':
        this.toast.exito(`Agregaste ${producto.nombre} al carrito.`);
        return true;
      case 'tope':
        this.toast.info(
          producto.stock > CANTIDAD_MAXIMA_POR_PRODUCTO
            ? `Puedes pedir hasta ${CANTIDAD_MAXIMA_POR_PRODUCTO} ${pluralizarUnidad(producto.unidad, CANTIDAD_MAXIMA_POR_PRODUCTO)} de ${producto.nombre} por pedido. Ya las tienes en tu carrito.`
            : `Solo hay ${producto.stock} ${pluralizarUnidad(producto.unidad, producto.stock)} de ${producto.nombre}. Ya las tienes todas en tu carrito.`,
        );
        return true;
      default:
        this.toast.info(
          producto.stock < 1
            ? `${producto.nombre} está agotado por ahora.`
            : `Ya tienes en tu carrito todo el ${producto.nombre} disponible.`,
        );
        return false;
    }
  }
}
