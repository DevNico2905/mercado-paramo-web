import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Impacto as DatosImpacto } from '../../../core/api/models';
import { Impacto } from './impacto';

registerLocaleData(localeEsCo);

const URL = `${environment.apiUrl}/api/admin/reportes/impacto`;

describe('Impacto (fundación)', () => {
  let fixture: ComponentFixture<Impacto>;
  let backend: HttpTestingController;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');

  function abrir(impacto: DatosImpacto): void {
    fixture = TestBed.createComponent(Impacto);
    fixture.detectChanges();
    backend.expectOne(URL).flush(impacto);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('titula con lo que llegó a los productores y muestra las cifras de la plataforma', () => {
    abrir({
      productoresVerificados: 12,
      pedidosEntregados: 48,
      totalVendido: 1_200_000,
      recibidoPorProductores: 1_140_000,
      comisionPlataforma: 60_000,
      participacionPorcentaje: 95,
    });

    expect(texto()).toContain('$1.140.000 llegaron directamente a los productores');
    expect(texto()).toMatch(/Productores verificados ?12/);
    expect(texto()).toMatch(/Pedidos entregados ?48/);
    expect(texto()).toMatch(/Total vendido ?\$1\.200\.000/);
    expect(texto()).toContain('En Mercado Páramo 95 %');
    expect(texto()).toContain('Con intermediarios 15–25 %');
    expect(texto()).toContain(
      'Con intermediarios los productores habrían recibido entre $180.000 y $300.000.',
    );
    expect(texto()).toContain('+$840.000');
    expect(texto()).toContain('$60.000 de comisión');
  });

  it('muestra un estado vacío cuando aún no hay ventas entregadas', () => {
    abrir({
      productoresVerificados: 3,
      pedidosEntregados: 0,
      totalVendido: 0,
      recibidoPorProductores: 0,
      comisionPlataforma: 0,
      participacionPorcentaje: null,
    });

    expect(texto()).toContain('El impacto empieza con el primer pedido entregado');
    expect(texto()).toContain('3 productores verificados están listos para vender');
    expect(texto()).not.toContain('llegaron directamente');
  });
});
