import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideLogOut, LucideShoppingBasket } from '@lucide/angular';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth-service';
import { AgregarAlCarrito } from '../core/cart/agregar-al-carrito';
import { CartService } from '../core/cart/cart-service';
import { CopPipe } from '../shared/pipes/cop-pipe';
import { inicioPorRol } from '../core/auth/inicio-por-rol';
import { ToastService } from '../core/ui/toast-service';
import { ConfirmDialog } from '../shared/components/confirm-dialog/confirm-dialog';
import { destinosPara } from './navegacion';
import { ToastContainer } from './toast-container';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideLogOut,
    LucideShoppingBasket,
    CopPipe,
    ToastContainer,
    ConfirmDialog,
  ],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  private readonly agregarAlCarrito = inject(AgregarAlCarrito);
  protected readonly cart = inject(CartService);

  private readonly ruta = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly destinos = computed(() => destinosPara(this.auth.rol()));
  /** Barra fija "Ver carrito" (móvil): con ítems, para quien puede comprar y fuera del carrito. */
  protected readonly mostrarBarraCarrito = computed(
    () =>
      !this.cart.estaVacio() &&
      this.agregarAlCarrito.disponible() &&
      !this.ruta().startsWith('/carrito'),
  );
  protected readonly inicio = computed(() => inicioPorRol(this.auth.rol()));

  protected salir(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
    this.toast.info('Cerraste tu sesión. ¡Vuelve pronto!');
  }
}
