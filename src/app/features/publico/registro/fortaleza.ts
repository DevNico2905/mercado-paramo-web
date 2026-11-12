export interface Fortaleza {
  /** De 1 (débil) a 3 (fuerte). */
  nivel: 1 | 2 | 3;
  etiqueta: string;
}

/** Estima qué tan fuerte es una contraseña, solo como guía para quien la escribe. */
export function fortalezaDe(password: string): Fortaleza | null {
  if (password.length === 0) {
    return null;
  }
  if (password.length < 8) {
    return { nivel: 1, etiqueta: 'Muy corta: usa al menos 8 caracteres' };
  }
  const variedad = [/[a-záéíóúñ]/, /[A-ZÁÉÍÓÚÑ]/, /\d/, /[^\p{L}\d]/u].filter((patron) =>
    patron.test(password),
  ).length;
  if (password.length >= 12 && variedad >= 3) {
    return { nivel: 3, etiqueta: 'Fuerte' };
  }
  if (variedad >= 2) {
    return { nivel: 2, etiqueta: 'Aceptable: agrega más caracteres, números o símbolos' };
  }
  return { nivel: 1, etiqueta: 'Débil: combina letras, números o símbolos' };
}
