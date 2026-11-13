import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { EstadoVerificacion, Perfil } from '../core/api/models';
import { AuthService } from '../core/auth/auth-service';
import { ToastService } from '../core/ui/toast-service';
import { Shell } from './shell';

registerLocaleData(localeEsCo);

@Component({ template: '' })
class Vacia {}

const ME = `${environment.apiUrl}/api/usuarios/me`;

function productor(estadoVerificacion: EstadoVerificacion): Perfil {
  return {
    id: 10,
    nombre: 'Pedro Antonio Rodríguez',
    email: 'pedro@correo.com',
    rol: 'PRODUCTOR',
    estadoVerificacion,
    vereda: 'La Concepción',
  };
}

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  const raiz = () => fixture.nativeElement as HTMLElement;
  const texto = () => raiz().textContent.replace(/\s+/g, ' ');
  const disparador = () =>
    raiz().querySelector<HTMLButtonElement>('app-user-menu button[aria-expanded]');

  async function iniciar(perfil: Perfil | null, url = '/'): Promise<void> {
    if (perfil) {
      auth.cargarPerfil().subscribe();
      backend.expectOne(ME).flush(perfil);
    }
    fixture = TestBed.createComponent(Shell);
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: Vacia }]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => backend.verify());

  describe('identidad del usuario', () => {
    it('muestra avatar con iniciales, saludo y rol en lenguaje humano', async () => {
      await iniciar(productor('VERIFICADO'));

      expect(disparador()?.textContent).toContain('PR');
      expect(texto()).toContain('Hola, Pedro');
      expect(texto()).toContain('Productor');
    });

    it('la fundación se ve como "Fundación"', async () => {
      await iniciar({
        ...productor('VERIFICADO'),
        rol: 'ADMIN',
        estadoVerificacion: null,
        vereda: null,
      });

      expect(texto()).toContain('Fundación');
      expect(texto()).not.toContain('ADMIN');
    });

    it('el menú muestra nombre completo, correo y "Salir", y Salir cierra la sesión', async () => {
      await iniciar(productor('VERIFICADO'));
      disparador()?.click();
      fixture.detectChanges();

      expect(disparador()?.getAttribute('aria-expanded')).toBe('true');
      expect(texto()).toContain('Pedro Antonio Rodríguez');
      expect(texto()).toContain('pedro@correo.com');

      const salir = [...raiz().querySelectorAll('app-user-menu button')].find((b) =>
        b.textContent.includes('Salir'),
      ) as HTMLButtonElement;
      salir.click();
      fixture.detectChanges();

      expect(auth.estaAutenticado()).toBe(false);
      expect(raiz().querySelector('app-user-menu')).toBeNull();
    });

    it('Esc cierra el menú y devuelve el foco al avatar', async () => {
      await iniciar(productor('VERIFICADO'));
      disparador()?.click();
      fixture.detectChanges();
      raiz()
        .querySelector('app-user-menu')
        ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(disparador()?.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(disparador());
    });

    it('un clic afuera cierra el menú', async () => {
      await iniciar(productor('VERIFICADO'));
      disparador()?.click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();

      expect(disparador()?.getAttribute('aria-expanded')).toBe('false');
    });

    it('"Salir" ya no está en la barra inferior', async () => {
      await iniciar(productor('VERIFICADO'));
      const barra = raiz().querySelector('nav.fixed');

      expect(barra?.textContent).not.toContain('Salir');
    });

    it('sin sesión no hay avatar', async () => {
      await iniciar(null);

      expect(raiz().querySelector('app-user-menu')).toBeNull();
      expect(texto()).toContain('Entrar');
    });
  });

  describe('verificación del productor', () => {
    it('muestra el aviso en las rutas del productor mientras no esté verificado', async () => {
      await iniciar(productor('PENDIENTE'), '/productor/pedidos');

      expect(texto()).toContain('Tu cuenta está en revisión');
    });

    it('no lo muestra fuera de /productor ni cuando ya está verificado', async () => {
      await iniciar(productor('RECHAZADO'), '/');
      expect(texto()).not.toContain('Tu cuenta no fue aprobada');

      auth.cargarPerfil().subscribe();
      backend.expectOne(ME).flush(productor('VERIFICADO'));
      await router.navigateByUrl('/productor/productos');
      fixture.detectChanges();
      expect(texto()).not.toContain('Tu cuenta');
    });

    it('al navegar a /productor refresca el perfil y avisa cuando queda verificado', async () => {
      await iniciar(productor('PENDIENTE'), '/');
      vi.spyOn(auth, 'antiguedadPerfil').mockReturnValue(60_000);

      await router.navigateByUrl('/productor/productos');
      backend.expectOne(ME).flush(productor('VERIFICADO'));
      fixture.detectChanges();

      expect(
        TestBed.inject(ToastService)
          .toasts()
          .map((t) => t.mensaje),
      ).toContain('¡Tu cuenta fue verificada! Ya puedes publicar productos.');
      expect(texto()).not.toContain('Tu cuenta está en revisión');
    });

    it('al volver a la pestaña refresca el perfil del productor', async () => {
      await iniciar(productor('PENDIENTE'), '/productor/pedidos');
      vi.spyOn(auth, 'antiguedadPerfil').mockReturnValue(60_000);

      document.dispatchEvent(new Event('visibilitychange'));
      backend.expectOne(ME).flush(productor('PENDIENTE'));

      expect(TestBed.inject(ToastService).toasts()).toEqual([]);
    });

    it('no repite la consulta si el perfil se acaba de cargar', async () => {
      await iniciar(productor('PENDIENTE'), '/');
      await router.navigateByUrl('/productor/pedidos');

      backend.expectNone(ME);
    });

    it('no consulta el perfil de otros roles al volver a la pestaña', async () => {
      await iniciar({
        ...productor('VERIFICADO'),
        rol: 'COMPRADOR',
        estadoVerificacion: null,
        vereda: null,
      });
      vi.spyOn(auth, 'antiguedadPerfil').mockReturnValue(60_000);
      document.dispatchEvent(new Event('visibilitychange'));

      backend.expectNone(ME);
    });
  });
});
