import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorage } from './token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const token = inject(TokenStorage).obtener();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
