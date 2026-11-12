import { AbstractControl } from '@angular/forms';

/** Mensajes por clave de error de validación (`required`, `email`, `minlength`…). */
export type MensajesDeError = Record<string, string>;

/**
 * Mensaje de error que debe mostrarse bajo un campo, o `null` si no hay que mostrar nada.
 * Los errores que envía la API (clave `servidor`) tienen prioridad.
 */
export function mensajeDeError(control: AbstractControl, mensajes: MensajesDeError): string | null {
  if (!control.touched || !control.errors) {
    return null;
  }
  const errores = control.errors;
  if (typeof errores['servidor'] === 'string') {
    return errores['servidor'];
  }
  const clave = Object.keys(errores).find((error) => error in mensajes);
  return clave ? mensajes[clave] : 'Revisa este campo.';
}

/** Solo se aceptan rutas internas en `?redirect=`, para no llevar al usuario a otro sitio. */
export function redirectSeguro(destino: string | null | undefined): string | null {
  return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : null;
}
