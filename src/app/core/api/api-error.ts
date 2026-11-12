import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

/** Formato de error de la API (SPEC 4.3). No está descrito en openapi.json. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errores?: Record<string, string>;
}

export function leerApiError(error: unknown): ApiError | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const cuerpo: unknown = error.error;
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null;
  }
  return typeof (cuerpo as ApiError).message === 'string' ? (cuerpo as ApiError) : null;
}

/**
 * Lleva los errores de validación de la API a los campos del formulario, bajo la clave
 * `servidor`. Devuelve el mensaje general cuando el error no corresponde a ningún campo,
 * o `null` si todo quedó asignado a campos o el error no trae un mensaje de la API.
 */
export function aplicarErroresApi(formulario: AbstractControl, error: unknown): string | null {
  const apiError = leerApiError(error);
  if (!apiError) {
    return null;
  }
  let asignados = 0;
  for (const [campo, mensaje] of Object.entries(apiError.errores ?? {})) {
    const control = formulario.get(campo);
    if (control) {
      control.setErrors({ ...control.errors, servidor: mensaje });
      control.markAsTouched();
      asignados++;
    }
  }
  return asignados > 0 ? null : apiError.message;
}
