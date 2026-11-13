import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideShoppingBasket } from '@lucide/icons';
import { iconos } from '../shared/iconos';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth-service';
import { AgregarAlCarrito } from '../core/cart/agregar-al-carrito';
import { CartService } from '../core/cart/cart-service';
import { CopPipe } from '../shared/pipes/cop-pipe';
import { inicioPorRol } from '../core/auth/inicio-por-rol';
import { SincronizacionPerfil } from '../core/auth/sincronizacion-perfil';
import { VerificacionBanner } from '../shared/components/verificacion-banner/verificacion-banner';
import { UserMenu } from './user-menu';
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
    CopPipe,
    ToastContainer,
    ConfirmDialog,
    UserMenu,
    VerificacionBanner,
  ],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly iconos = iconos({ LucideShoppingBasket });

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
  /** Aviso de verificación en todas las pantallas del productor mientras no esté verificado. */
  protected readonly verificacionPendiente = computed(() => {
    const usuario = this.auth.usuario();
    const estado = usuario?.estadoVerificacion ?? null;
    return usuario?.rol === 'PRODUCTOR' &&
      this.ruta().startsWith('/productor') &&
      estado !== 'VERIFICADO'
      ? estado
      : null;
  });

  constructor() {
    inject(SincronizacionPerfil).iniciar();
  }

  protected salir(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
    this.toast.info('Cerraste tu sesión. ¡Vuelve pronto!');
  }
}
