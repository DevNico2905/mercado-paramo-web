import { Pipe, PipeTransform } from '@angular/core';

const VOCAL_FINAL = /[aeiouáéíóú]$/i;
/** Vocal con tilde en la última sílaba, seguida solo de consonantes: "camión", "compás". */
const TILDE_FINAL = /[áéíóú](?=[^aeiouáéíóú]*$)/i;
const SIN_TILDE: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

function pluralizarPalabra(palabra: string): string {
  // Sin vocales es una abreviatura (kg, lb, ml): no se pluraliza.
  if (!/[aeiouáéíóú]/i.test(palabra)) {
    return palabra;
  }
  const mayusculas = palabra === palabra.toLocaleUpperCase('es-CO') && /\p{L}/u.test(palabra);
  const base = palabra.toLocaleLowerCase('es-CO');
  let plural: string;
  if (VOCAL_FINAL.test(base)) {
    plural = `${base}s`;
  } else if (base.endsWith('z')) {
    plural = `${base.slice(0, -1)}ces`;
  } else if (/[sx]$/.test(base) && !TILDE_FINAL.test(base)) {
    // Las palabras graves terminadas en -s o -x no cambian: "el tórax", "los tórax".
    plural = base;
  } else {
    plural = `${base.replace(TILDE_FINAL, (vocal) => SIN_TILDE[vocal.toLowerCase()] ?? vocal)}es`;
  }
  if (mayusculas) {
    return plural.toLocaleUpperCase('es-CO');
  }
  return palabra.charAt(0) !== base.charAt(0)
    ? plural.charAt(0).toLocaleUpperCase('es-CO') + plural.slice(1)
    : plural;
}

/**
 * Unidad de venta concordada con la cantidad: 1 libra, 2 libras, 3 unidades.
 * En unidades de varias palabras se pluraliza la primera: "frasco de miel" → "frascos de miel".
 */
export function pluralizarUnidad(unidad: string, cantidad: number): string {
  const limpia = unidad.trim();
  if (Math.abs(cantidad) === 1 || limpia === '') {
    return limpia;
  }
  const [primera, ...resto] = limpia.split(/\s+/);
  return [pluralizarPalabra(primera), ...resto].join(' ');
}

/** Uso: `{{ cantidad }} {{ unidad | unidad: cantidad }}`. */
@Pipe({ name: 'unidad' })
export class UnidadPipe implements PipeTransform {
  transform(unidad: string | null | undefined, cantidad: number | null | undefined): string {
    return unidad ? pluralizarUnidad(unidad, cantidad ?? 0) : '';
  }
}
