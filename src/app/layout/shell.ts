import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../core/auth/auth-service';
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

  protected readonly destinos = computed(() => destinosPara(this.auth.rol()));
  protected readonly inicio = computed(() => inicioPorRol(this.auth.rol()));

  protected salir(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
    this.toast.info('Cerraste tu sesión. ¡Vuelve pronto!');
  }
}
