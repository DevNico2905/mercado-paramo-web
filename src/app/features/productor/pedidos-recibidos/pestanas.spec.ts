import { EstadoPedido, Pedido } from '../../../core/api/models';
import { accionesDelProductor, agruparPorPestana, leerPestana } from './pestanas';

const pedido = (id: number, estado: EstadoPedido) => ({ id, estado }) as Pedido;

describe('pestañas de pedidos recibidos', () => {
  it('agrupa: Por atender (PENDIENTE), En curso (ACEPTADO) e Historial (el resto)', () => {
    const grupos = agruparPorPestana([
      pedido(1, 'PENDIENTE'),
      pedido(2, 'ACEPTADO'),
      pedido(3, 'ENTREGADO'),
      pedido(4, 'RECHAZADO'),
      pedido(5, 'CANCELADO'),
      pedido(6, 'PENDIENTE'),
    ]);

    expect(grupos['por-atender'].map((p) => p.id)).toEqual([1, 6]);
    expect(grupos['en-curso'].map((p) => p.id)).toEqual([2]);
    expect(grupos.historial.map((p) => p.id)).toEqual([3, 4, 5]);
  });

  it('solo ofrece las transiciones de la tabla 5.2', () => {
    const estados = (estado: EstadoPedido) => accionesDelProductor(estado).map((a) => a.estado);

    expect(estados('PENDIENTE')).toEqual(['ACEPTADO', 'RECHAZADO']);
    expect(estados('ACEPTADO')).toEqual(['ENTREGADO']);
    expect(estados('ENTREGADO')).toEqual([]);
    expect(estados('RECHAZADO')).toEqual([]);
    expect(estados('CANCELADO')).toEqual([]);
  });

  it('solo pide confirmación para rechazar', () => {
    const conConfirmacion = [
      ...accionesDelProductor('PENDIENTE'),
      ...accionesDelProductor('ACEPTADO'),
    ]
      .filter((accion) => accion.confirmar)
      .map((accion) => accion.estado);

    expect(conConfirmacion).toEqual(['RECHAZADO']);
  });

  it('abre "Por atender" por defecto', () => {
    expect(leerPestana(undefined)).toBe('por-atender');
    expect(leerPestana('otra')).toBe('por-atender');
    expect(leerPestana('historial')).toBe('historial');
  });
});
