import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Resalta el botón de confirmar como acción destructiva. */
  peligro?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _solicitud = signal<OpcionesConfirmacion | null>(null);
  private resolver: ((confirmado: boolean) => void) | null = null;

  readonly solicitud = this._solicitud.asReadonly();

  /** Abre el diálogo de confirmación y resuelve con la decisión del usuario. */
  confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    this.responder(false);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this._solicitud.set(opciones);
    });
  }

  responder(confirmado: boolean): void {
    this.resolver?.(confirmado);
    this.resolver = null;
    this._solicitud.set(null);
  }
}
