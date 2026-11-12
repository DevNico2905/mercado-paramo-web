import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../ui/toast-service';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';
import { errorInterceptor } from './error-interceptor';
import { authGuard, guestGuard, roleGuard } from './guards';
import { TokenStorage } from './token-storage';

const api = (ruta: string) => `${environment.apiUrl}${ruta}`;
const errorApi = (status: number, message: string) => ({ status, message, errores: {} });

describe('autenticación', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let tokenStorage: TokenStorage;
  let toast: ToastService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', children: [] },
          { path: 'mis-pedidos', canActivate: [authGuard, roleGuard(['COMPRADOR'])], children: [] },
          { path: 'registro', canActivate: [guestGuard], children: [] },
          { path: 'productor/pedidos', children: [] },
        ]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorage);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  afterEach(() => backend.verify());

  function iniciarSesion(rol: 'COMPRADOR' | 'PRODUCTOR' | 'ADMIN'): void {
    auth.login({ email: 'a@b.co', password: 'secreto123' }).subscribe();
    backend
      .expectOne(api('/api/auth/login'))
      .flush({ token: 'jwt', tipo: 'Bearer', expiraEnSegundos: 3600 });
    backend.expectOne(api('/api/usuarios/me')).flush({ id: 1, nombre: 'Pedro', rol });
  }

  describe('AuthService', () => {
    it('login guarda el token y carga el perfil con el Bearer', () => {
      auth.login({ email: 'a@b.co', password: 'secreto123' }).subscribe();

      const login = backend.expectOne(api('/api/auth/login'));
      expect(login.request.headers.has('Authorization')).toBe(false);
      login.flush({ token: 'jwt', tipo: 'Bearer', expiraEnSegundos: 3600 });

      const perfil = backend.expectOne(api('/api/usuarios/me'));
      expect(perfil.request.headers.get('Authorization')).toBe('Bearer jwt');
      perfil.flush({ id: 1, nombre: 'Pedro', rol: 'PRODUCTOR', estadoVerificacion: 'PENDIENTE' });

      expect(auth.estaAutenticado()).toBe(true);
      expect(auth.rol()).toBe('PRODUCTOR');
      expect(auth.usuario()?.estadoVerificacion).toBe('PENDIENTE');
      expect(tokenStorage.obtener()).toBe('jwt');
    });

    it('un 401 del login no muestra toast ni redirige', () => {
      let estado = 0;
      auth.login({ email: 'a@b.co', password: 'mala' }).subscribe({
        error: (error: { status: number }) => (estado = error.status),
      });
      backend
        .expectOne(api('/api/auth/login'))
        .flush(errorApi(401, 'Credenciales inválidas'), { status: 401, statusText: 'Unauthorized' });

      expect(estado).toBe(401);
      expect(toast.toasts()).toEqual([]);
      expect(auth.estaAutenticado()).toBe(false);
    });

    it('al iniciar, restaura la sesión si el token está vigente', async () => {
      tokenStorage.guardar('jwt', 3600);
      const listo = auth.inicializar();
      backend.expectOne(api('/api/usuarios/me')).flush({ id: 1, nombre: 'María', rol: 'COMPRADOR' });
      await listo;

      expect(auth.rol()).toBe('COMPRADOR');
    });

    it('al iniciar, cierra la sesión si el token venció', async () => {
      tokenStorage.guardar('jwt', -1);
      await auth.inicializar();

      expect(tokenStorage.hayToken()).toBe(false);
      expect(auth.estaAutenticado()).toBe(false);
    });
  });

  describe('authInterceptor', () => {
    it('no envía el token a otros dominios', () => {
      tokenStorage.guardar('jwt', 3600);
      http.get('https://otro-sitio.example/datos').subscribe();

      const peticion = backend.expectOne('https://otro-sitio.example/datos');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });
  });

  describe('errorInterceptor', () => {
    it('con un 401 autenticado cierra la sesión, avisa y lleva al login con redirect', async () => {
      iniciarSesion('COMPRADOR');
      await router.navigateByUrl('/mis-pedidos');
      const navegar = vi.spyOn(router, 'navigate');

      http.get(api('/api/pedidos')).subscribe({ error: () => undefined });
      backend
        .expectOne(api('/api/pedidos'))
        .flush(errorApi(401, 'Token vencido'), { status: 401, statusText: 'Unauthorized' });

      expect(auth.estaAutenticado()).toBe(false);
      expect(tokenStorage.hayToken()).toBe(false);
      expect(navegar).toHaveBeenCalledWith(['/login'], {
        queryParams: { redirect: '/mis-pedidos' },
      });
      expect(toast.toasts().map((t) => t.mensaje)).toEqual([
        'Tu sesión expiró. Inicia sesión de nuevo.',
      ]);
    });

    it('un 401 sin sesión no redirige', () => {
      const navegar = vi.spyOn(router, 'navigate');
      http.get(api('/api/pedidos')).subscribe({ error: () => undefined });
      backend
        .expectOne(api('/api/pedidos'))
        .flush(errorApi(401, 'Se requiere autenticación'), { status: 401, statusText: 'Unauthorized' });

      expect(navegar).not.toHaveBeenCalled();
      expect(toast.toasts()).toEqual([]);
    });

    it('con un 403 muestra el mensaje del servidor', () => {
      http.post(api('/api/productor/productos'), {}).subscribe({ error: () => undefined });
      backend
        .expectOne(api('/api/productor/productos'))
        .flush(errorApi(403, 'Tu cuenta de productor aún no ha sido verificada'), {
          status: 403,
          statusText: 'Forbidden',
        });

      expect(toast.toasts().map((t) => t.mensaje)).toEqual([
        'Tu cuenta de productor aún no ha sido verificada',
      ]);
    });

    it('con un error de red o un 5xx muestra un solo aviso de conexión', () => {
      http.get(api('/api/categorias')).subscribe({ error: () => undefined });
      http.get(api('/api/productos')).subscribe({ error: () => undefined });
      backend.expectOne(api('/api/categorias')).error(new ProgressEvent('error'));
      backend.expectOne(api('/api/productos')).flush(null, { status: 503, statusText: 'Unavailable' });

      expect(toast.toasts().map((t) => t.mensaje)).toEqual([
        'No pudimos conectar con el servidor. Intenta de nuevo.',
      ]);
    });
  });

  describe('guards', () => {
    it('sin sesión, una ruta protegida lleva al login con redirect', async () => {
      await router.navigateByUrl('/mis-pedidos');

      expect(router.url).toBe('/login?redirect=%2Fmis-pedidos');
    });

    it('con otro rol, lleva al inicio del rol del usuario', async () => {
      iniciarSesion('PRODUCTOR');
      await router.navigateByUrl('/mis-pedidos');

      expect(router.url).toBe('/productor/pedidos');
    });

    it('con el rol correcto, deja pasar', async () => {
      iniciarSesion('COMPRADOR');
      await router.navigateByUrl('/mis-pedidos');

      expect(router.url).toBe('/mis-pedidos');
    });

    it('con sesión, las pantallas de invitado llevan al inicio del rol', async () => {
      iniciarSesion('PRODUCTOR');
      await router.navigateByUrl('/registro');

      expect(router.url).toBe('/productor/pedidos');
    });
  });
});
