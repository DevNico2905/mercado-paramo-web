import type { LucideIconData } from '@lucide/angular';
import type { LucideIconData as DatosIcono } from '@lucide/icons';

/**
 * Prepara iconos de `@lucide/icons` para `<svg [lucideIcon]>` de `@lucide/angular`.
 *
 * Cada icono de `@lucide/angular` es un componente completo (unos 3,5 kB) y el paquete es un
 * único módulo, así que todos los iconos usados acababan en el bundle inicial. Con los datos
 * de `@lucide/icons` (un módulo por icono) y el componente genérico `LucideDynamicIcon`, cada
 * icono pesa unos cientos de bytes y viaja solo en el chunk de la pantalla que lo usa.
 */
function preparar(datos: DatosIcono, nombre: string): LucideIconData {
  return { ...datos, name: datos.name ?? nombre };
}

export function iconos<K extends string>(datos: Record<K, DatosIcono>): Record<K, LucideIconData> {
  const resultado = {} as Record<K, LucideIconData>;
  for (const clave of Object.keys(datos) as K[]) {
    resultado[clave] = preparar(datos[clave], clave);
  }
  return resultado;
}

/** Un solo icono, para usos fuera de un componente (por ejemplo, la navegación). */
export function icono(datos: DatosIcono): LucideIconData {
  return preparar(datos, datos.name ?? '');
}
