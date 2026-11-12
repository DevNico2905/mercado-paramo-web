import { fortalezaDe } from '../../features/publico/registro/fortaleza';
import { arteDeCategoria } from './category-art/categorias';
import { pasosDelPedido } from './order-timeline/order-timeline';

describe('arteDeCategoria', () => {
  it('asigna el emoji de cada categoría, sin importar tildes ni mayúsculas', () => {
    expect(arteDeCategoria('Tubérculos').emoji).toBe('🥔');
    expect(arteDeCategoria('LACTEOS').emoji).toBe('🧀');
    expect(arteDeCategoria('Frutas').emoji).toBe('🍓');
    expect(arteDeCategoria('Hortalizas').emoji).toBe('🥬');
    expect(arteDeCategoria('Hierbas y aromáticas').emoji).toBe('🌿');
  });

  it('usa 🌾 para cualquier otra categoría', () => {
    expect(arteDeCategoria('Apicultura').emoji).toBe('🌾');
    expect(arteDeCategoria(null).emoji).toBe('🌾');
  });
});

describe('pasosDelPedido', () => {
  const situaciones = (estado: Parameters<typeof pasosDelPedido>[0]) =>
    pasosDelPedido(estado).map((paso) => `${paso.etiqueta}:${paso.situacion}`);

  it('avanza por PENDIENTE → ACEPTADO → ENTREGADO', () => {
    expect(situaciones('PENDIENTE')).toEqual([
      'Pendiente:actual',
      'Aceptado:pendiente',
      'Entregado:pendiente',
    ]);
    expect(situaciones('ACEPTADO')).toEqual([
      'Pendiente:hecho',
      'Aceptado:actual',
      'Entregado:pendiente',
    ]);
    expect(situaciones('ENTREGADO')).toEqual([
      'Pendiente:hecho',
      'Aceptado:hecho',
      'Entregado:hecho',
    ]);
  });

  it('marca los finales alternativos como fallidos', () => {
    expect(situaciones('RECHAZADO')).toEqual([
      'Pendiente:hecho',
      'Rechazado:fallido',
      'Entregado:pendiente',
    ]);
    expect(situaciones('CANCELADO')).toEqual([
      'Pendiente:hecho',
      'Cancelado:fallido',
      'Entregado:pendiente',
    ]);
  });
});

describe('fortalezaDe', () => {
  it('clasifica la contraseña en tres niveles', () => {
    expect(fortalezaDe('')).toBeNull();
    expect(fortalezaDe('abc')?.nivel).toBe(1);
    expect(fortalezaDe('abcdefgh')?.nivel).toBe(1);
    expect(fortalezaDe('abcdefg1')?.nivel).toBe(2);
    expect(fortalezaDe('Paramo-2026-seguro')?.nivel).toBe(3);
  });
});
