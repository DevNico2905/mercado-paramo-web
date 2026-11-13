import { UnidadPipe, pluralizarUnidad } from './unidad-pipe';

describe('pluralizarUnidad', () => {
  it('pluraliza las unidades sugeridas', () => {
    expect(pluralizarUnidad('libra', 2)).toBe('libras');
    expect(pluralizarUnidad('litro', 4)).toBe('litros');
    expect(pluralizarUnidad('kilo', 3)).toBe('kilos');
    expect(pluralizarUnidad('unidad', 5)).toBe('unidades');
    expect(pluralizarUnidad('atado', 2)).toBe('atados');
    expect(pluralizarUnidad('docena', 2)).toBe('docenas');
  });

  it('con 1 se mantiene en singular; con 0 va en plural', () => {
    expect(pluralizarUnidad('libra', 1)).toBe('libra');
    expect(pluralizarUnidad('unidad', 1)).toBe('unidad');
    expect(pluralizarUnidad('libra', 0)).toBe('libras');
  });

  it('aplica la regla general: vocal + s, consonante + es', () => {
    expect(pluralizarUnidad('frasco', 2)).toBe('frascos');
    expect(pluralizarUnidad('bulto', 2)).toBe('bultos');
    expect(pluralizarUnidad('canastilla', 2)).toBe('canastillas');
    expect(pluralizarUnidad('papel', 2)).toBe('papeles');
  });

  it('cubre los casos especiales del español', () => {
    expect(pluralizarUnidad('cajón', 2)).toBe('cajones');
    expect(pluralizarUnidad('ración', 3)).toBe('raciones');
    expect(pluralizarUnidad('haz', 2)).toBe('haces');
    expect(pluralizarUnidad('compás', 2)).toBe('compases');
  });

  it('pluraliza la primera palabra y respeta mayúsculas y espacios', () => {
    expect(pluralizarUnidad('frasco de miel', 2)).toBe('frascos de miel');
    expect(pluralizarUnidad('  Libra ', 2)).toBe('Libras');
    expect(pluralizarUnidad('LIBRA', 2)).toBe('LIBRAS');
    expect(pluralizarUnidad('kg', 2)).toBe('kg');
  });

  it('el pipe tolera valores vacíos', () => {
    const pipe = new UnidadPipe();
    expect(pipe.transform('libra', 2)).toBe('libras');
    expect(pipe.transform(null, 2)).toBe('');
    expect(pipe.transform('kilo', null)).toBe('kilos');
  });
});
