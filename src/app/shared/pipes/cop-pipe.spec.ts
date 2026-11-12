import { CopPipe } from './cop-pipe';

describe('CopPipe', () => {
  const pipe = new CopPipe();
  const sinEspacios = (texto: string) => texto.replace(/\s/g, '');

  it('formatea pesos colombianos sin decimales y con punto de miles', () => {
    expect(sinEspacios(pipe.transform(24000))).toBe('$24.000');
    expect(sinEspacios(pipe.transform(1234567))).toBe('$1.234.567');
  });

  it('redondea los decimales', () => {
    expect(sinEspacios(pipe.transform(22800.4))).toBe('$22.800');
  });

  it('devuelve una cadena vacía cuando no hay valor', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
