import { Injectable } from '@angular/core';

const CLAVE_TOKEN = 'mp_token';
const CLAVE_EXPIRA = 'mp_token_expira';

/**
 * Única clase que sabe dónde se guarda el token. Para migrar a una cookie HttpOnly
 * basta con cambiar este archivo.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  guardar(token: string, expiraEnSegundos: number): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_EXPIRA, String(Date.now() + expiraEnSegundos * 1000));
  }

  /** Devuelve el token solo si sigue vigente. */
  obtener(): string | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const expira = Number(localStorage.getItem(CLAVE_EXPIRA));
    return token && Number.isFinite(expira) && expira > Date.now() ? token : null;
  }

  /** Indica si hay un token guardado, vigente o vencido. */
  hayToken(): boolean {
    return localStorage.getItem(CLAVE_TOKEN) !== null;
  }

  limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_EXPIRA);
  }
}
