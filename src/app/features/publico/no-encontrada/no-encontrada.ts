import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { inicioPorRol } from '../../../core/auth/inicio-por-rol';

const DESTINOS = {
  COMPRADOR: 'Volver al catálogo',
  PRODUCTOR: 'Ir a mis pedidos',
  ADMIN: 'Ir a verificación de productores',
} as const;

/** Página 404: la ruta no existe. Ofrece volver al inicio que corresponde al rol. */
@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  templateUrl: './no-encontrada.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontrada {
  private readonly auth = inject(AuthService);

  protected readonly inicio = computed(() => inicioPorRol(this.auth.rol()));
  protected readonly textoInicio = computed(() => {
    const rol = this.auth.rol();
    return rol ? DESTINOS[rol] : 'Volver al catálogo';
  });
}
