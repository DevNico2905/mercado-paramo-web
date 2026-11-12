import { parametrosDePedidos } from '../../../core/api/pedidos-service';
import { aFiltrosDeApi, leerFiltros, rangoInvalido } from './filtros';

describe('filtros de Mis pedidos', () => {
  it('por defecto pide todos los pedidos, por fecha descendente', () => {
    const filtros = leerFiltros({});

    expect(filtros).toEqual({ estado: null, desde: null, hasta: null, orden: 'recientes' });
    expect(aFiltrosDeApi(filtros)).toEqual({ ordenarPor: 'FECHA', direccion: 'DESC' });
  });

  it('traduce la URL a los query params de la sección 5.1', () => {
    const filtros = leerFiltros({
      estado: 'ENTREGADO',
      desde: '2026-10-01',
      hasta: '2026-10-31',
      orden: 'mayor-total',
    });

    expect(parametrosDePedidos(aFiltrosDeApi(filtros)).toString()).toBe(
      'ordenarPor=TOTAL&direccion=DESC&estado=ENTREGADO&desde=2026-10-01&hasta=2026-10-31',
    );
  });

  it('descarta valores inválidos de la URL', () => {
    expect(
      leerFiltros({ estado: 'OTRO', desde: '01/10/2026', hasta: '2026-13-45', orden: 'x' }),
    ).toEqual({
      estado: null,
      desde: null,
      hasta: null,
      orden: 'recientes',
    });
  });

  it('detecta un rango de fechas invertido', () => {
    expect(rangoInvalido(leerFiltros({ desde: '2026-11-10', hasta: '2026-11-01' }))).toBe(true);
    expect(rangoInvalido(leerFiltros({ desde: '2026-11-01', hasta: '2026-11-01' }))).toBe(false);
  });
});
