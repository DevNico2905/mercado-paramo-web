import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { leerApiError } from '../api/api-error';
import { ToastService } from '../ui/toast-service';
import { AuthService, URL_LOGIN } from './auth-service';
import { TokenStorage } from './token-storage';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          const haySesion = tokenStorage.hayToken() || auth.estaAutenticado();
          if (req.url !== URL_LOGIN && haySesion) {
            auth.logout();
            const rutaActual = router.url;
            void router.navigate(['/login'], {
              queryParams: rutaActual.startsWith('/login') ? {} : { redirect: rutaActual },
            });
            toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
          }
        } else if (error.status === 403) {
          toast.error(
            leerApiError(error)?.message ?? 'No tienes permiso para realizar esta acción.',
          );
        } else if (error.status === 0 || error.status >= 500) {
          toast.error('No pudimos conectar con el servidor. Intenta de nuevo.');
        }
      }
      return throwError(() => error);
    }),
  );
};
