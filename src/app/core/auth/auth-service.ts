import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Perfil, Rol } from '../api/models';
import { TokenStorage } from './token-storage';

export const URL_LOGIN = `${environment.apiUrl}/api/auth/login`;
const URL_PERFIL = `${environment.apiUrl}/api/usuarios/me`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);

  private readonly _usuario = signal<Perfil | null>(null);

  readonly usuario = this._usuario.asReadonly();
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);
  readonly estaAutenticado = computed(() => this._usuario() !== null);

  /** Se ejecuta al iniciar la app: restaura la sesión si hay un token vigente. */
  inicializar(): Promise<void> {
    if (this.tokenStorage.obtener() === null) {
      this.logout();
      return Promise.resolve();
    }
    return firstValueFrom(
      this.cargarPerfil().pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      ),
    );
  }

  login(credenciales: LoginRequest): Observable<Perfil> {
    return this.http.post<LoginResponse>(URL_LOGIN, credenciales).pipe(
      tap(({ token, expiraEnSegundos }) => {
        if (!token || expiraEnSegundos === undefined) {
          throw new Error('La respuesta de inicio de sesión no trae el token.');
        }
        this.tokenStorage.guardar(token, expiraEnSegundos);
      }),
      switchMap(() => this.cargarPerfil()),
      catchError((error: unknown) => {
        this.logout();
        return throwError(() => error);
      }),
    );
  }

  cargarPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(URL_PERFIL).pipe(tap((perfil) => this._usuario.set(perfil)));
  }

  logout(): void {
    this.tokenStorage.limpiar();
    this._usuario.set(null);
  }
}
