import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

const DURACION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  private siguienteId = 1;

  readonly toasts = this._toasts.asReadonly();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private mostrar(tipo: TipoToast, mensaje: string): void {
    const repetido = this._toasts().some((t) => t.tipo === tipo && t.mensaje === mensaje);
    if (repetido) {
      return;
    }
    const id = this.siguienteId++;
    this._toasts.update((toasts) => [...toasts, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), DURACION_MS);
  }
}
