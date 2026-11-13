import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, fromEvent } from 'rxjs';
import { ToastService } from '../ui/toast-service';
import { AuthService } from './auth-service';

/** Margen para no repetir la consulta del perfil cuando se acaba de cargar (por ejemplo, al entrar). */
const MARGEN_MS = 5000;

/**
 * Mantiene al día el perfil del productor para que vea su verificación sin recargar: lo
 * consulta al navegar a /productor/** y cuando la pestaña vuelve a estar visible.
 */
@Injectable({ providedIn: 'root' })
export class SincronizacionPerfil {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);

  private iniciada = false;
  private consultando = false;

  iniciar(): void {
    if (this.iniciada) {
      return;
    }
    this.iniciada = true;
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        filter((evento) => evento.urlAfterRedirects.startsWith('/productor')),
      )
      .subscribe(() => this.refrescar());
    fromEvent(this.document, 'visibilitychange')
      .pipe(filter(() => this.document.visibilityState === 'visible'))
      .subscribe(() => this.refrescar());
  }

  refrescar(): void {
    if (
      this.consultando ||
      this.auth.rol() !== 'PRODUCTOR' ||
      this.auth.antiguedadPerfil() < MARGEN_MS
    ) {
      return;
    }
    const antes = this.auth.usuario()?.estadoVerificacion ?? null;
    this.consultando = true;
    this.auth.cargarPerfil().subscribe({
      next: (perfil) => {
        this.consultando = false;
        if (antes !== 'VERIFICADO' && perfil.estadoVerificacion === 'VERIFICADO') {
          this.toast.exito('¡Tu cuenta fue verificada! Ya puedes publicar productos.');
        }
      },
      error: () => (this.consultando = false),
    });
  }
}
