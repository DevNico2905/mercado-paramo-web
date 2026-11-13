import { Rol } from '../api/models';

/** Nombre del rol en lenguaje cotidiano, para mostrar en la interfaz. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  COMPRADOR: 'Comprador',
  PRODUCTOR: 'Productor',
  ADMIN: 'Fundación',
};

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? '';
}

/** Iniciales para el avatar: primera letra del primer y del último nombre. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '?';
  }
  const primera = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primera + ultima).toLocaleUpperCase('es-CO');
}
