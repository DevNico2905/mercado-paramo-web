import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Rol } from '../../../core/api/models';
import { AuthService } from '../../../core/auth/auth-service';
import { NoEncontrada } from './no-encontrada';

describe('Página no encontrada', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  function enlace(rol: Rol | null): HTMLAnchorElement | null {
    if (rol) {
      TestBed.inject(AuthService).cargarPerfil().subscribe();
      TestBed.inject(HttpTestingController)
        .expectOne(`${environment.apiUrl}/api/usuarios/me`)
        .flush({
          id: 1,
          nombre: 'Ana',
          email: 'a@b.co',
          rol,
          estadoVerificacion: null,
          vereda: null,
        });
    }
    const fixture = TestBed.createComponent(NoEncontrada);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('a');
  }

  it('sin sesión lleva al catálogo', () => {
    const a = enlace(null);
    expect(a?.getAttribute('href')).toBe('/');
    expect(a?.textContent).toContain('Volver al catálogo');
  });

  it('lleva al inicio de cada rol', () => {
    expect(enlace('PRODUCTOR')?.getAttribute('href')).toBe('/productor/pedidos');
  });

  it('la fundación vuelve a la verificación de productores', () => {
    expect(enlace('ADMIN')?.getAttribute('href')).toBe('/admin/productores');
  });
});
