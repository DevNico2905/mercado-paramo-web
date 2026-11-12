import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  const storage = new TokenStorage();

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('guarda el token con las claves mp_token y mp_token_expira', () => {
    vi.useFakeTimers({ now: 1_000_000 });
    storage.guardar('abc', 60);

    expect(localStorage.getItem('mp_token')).toBe('abc');
    expect(localStorage.getItem('mp_token_expira')).toBe(String(1_000_000 + 60_000));
    expect(storage.obtener()).toBe('abc');
  });

  it('no devuelve un token vencido, pero sabe que existe', () => {
    vi.useFakeTimers({ now: 1_000_000 });
    storage.guardar('abc', 60);
    vi.setSystemTime(1_000_000 + 60_001);

    expect(storage.obtener()).toBeNull();
    expect(storage.hayToken()).toBe(true);
  });

  it('limpia el token', () => {
    storage.guardar('abc', 60);
    storage.limpiar();

    expect(storage.obtener()).toBeNull();
    expect(storage.hayToken()).toBe(false);
  });
});
