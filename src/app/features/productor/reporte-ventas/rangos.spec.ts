import { fechasDe, leerRango } from './rangos';

describe('rangos del reporte', () => {
  const hoy = new Date(2026, 10, 12, 21, 30);

  it('calcula los atajos contando el día de hoy', () => {
    expect(fechasDe('7d', hoy)).toEqual({ desde: '2026-11-06', hasta: '2026-11-12' });
    expect(fechasDe('30d', hoy)).toEqual({ desde: '2026-10-14', hasta: '2026-11-12' });
    expect(fechasDe('mes', hoy)).toEqual({ desde: '2026-11-01', hasta: '2026-11-12' });
  });

  it('usa los últimos 30 días por defecto', () => {
    expect(leerRango(undefined)).toBe('30d');
    expect(leerRango('x')).toBe('30d');
  });

  it('valida el rango personalizado', () => {
    expect(fechasDe('personalizado', hoy, { desde: '2026-09-01', hasta: '2026-09-30' })).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    });
    expect(fechasDe('personalizado', hoy, { desde: '2026-09-01' })).toBeNull();
    expect(fechasDe('personalizado', hoy, { desde: '2026-09-30', hasta: '2026-09-01' })).toBeNull();
  });
});
