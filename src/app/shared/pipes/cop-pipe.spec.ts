import { CopPipe } from './cop-pipe';

describe('CopPipe', () => {
  const pipe = new CopPipe();

  it('formatea pesos colombianos sin decimales, con punto de miles y sin espacio tras el signo', () => {
    expect(pipe.transform(24000)).toBe('$24.000');
    expect(pipe.transform(1234567)).toBe('$1.234.567');
  });

  it('redondea los decimales', () => {
    expect(pipe.transform(22800.4)).toBe('$22.800');
  });

  it('devuelve una cadena vacía cuando no hay valor', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
