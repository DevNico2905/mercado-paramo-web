import { RangoFechas } from '../../../core/api/productor-service';

export type Rango = '7d' | '30d' | 'mes' | 'personalizado';

export const RANGOS: readonly { valor: Rango; etiqueta: string }[] = [
  { valor: '7d', etiqueta: 'Últimos 7 días' },
  { valor: '30d', etiqueta: 'Últimos 30 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'personalizado', etiqueta: 'Otras fechas' },
];

export const RANGO_POR_DEFECTO: Rango = '30d';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha local en formato `YYYY-MM-DD`, el que espera la API. */
export function fechaLocal(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function haceDias(hoy: Date, dias: number): Date {
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
}

export function leerRango(valor: string | undefined): Rango {
  return RANGOS.find((rango) => rango.valor === valor)?.valor ?? RANGO_POR_DEFECTO;
}

/**
 * Fechas que se piden a la API para un rango, contando el día de hoy. Para un rango
 * personalizado incompleto o invertido devuelve `null`.
 */
export function fechasDe(
  rango: Rango,
  hoy: Date,
  personalizado: { desde?: string; hasta?: string } = {},
): RangoFechas | null {
  const hasta = fechaLocal(hoy);
  switch (rango) {
    case '7d':
      return { desde: fechaLocal(haceDias(hoy, 6)), hasta };
    case '30d':
      return { desde: fechaLocal(haceDias(hoy, 29)), hasta };
    case 'mes':
      return { desde: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
    case 'personalizado': {
      const { desde, hasta: fin } = personalizado;
      if (!desde || !fin || !FECHA.test(desde) || !FECHA.test(fin) || desde > fin) {
        return null;
      }
      return { desde, hasta: fin };
    }
  }
}
