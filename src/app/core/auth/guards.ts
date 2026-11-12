import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../api/models';
import { AuthService } from './auth-service';
import { inicioPorRol } from './inicio-por-rol';

/** Requiere sesión. Sin sesión, lleva al login y recuerda la ruta pedida. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).estaAutenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Requiere uno de los roles indicados. Si no coincide, lleva al inicio del rol del usuario. */
export function roleGuard(roles: readonly Rol[]): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthService);
    if (!auth.estaAutenticado()) {
      return authGuard(route, state);
    }
    const rol = auth.rol();
    if (rol !== null && roles.includes(rol)) {
      return true;
    }
    return inject(Router).parseUrl(inicioPorRol(rol));
  };
}

/** Para pantallas "solo sin sesión" (login, registro). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.estaAutenticado()) {
    return true;
  }
  return inject(Router).parseUrl(inicioPorRol(auth.rol()));
};
